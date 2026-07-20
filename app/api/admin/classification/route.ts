import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";
import { buildOverallClassification, classifyStage, StageClassificationInput } from "@/lib/classification-engine";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function migrationMissing(error: any) {
  return error?.code === "42P01" || error?.code === "42703";
}

function resultStatus(validationStatus: string, existingStatus?: string | null) {
  if (validationStatus === "review") return "review";
  if (["official", "disqualified", "dnf"].includes(existingStatus ?? "")) return existingStatus as string;
  return "provisional";
}

async function getClassification(supabase: any, requestedEventId?: string | null) {
  const { data: events, error: eventError } = await supabase
    .from("events")
    .select("id, name, slug, status, starts_on, ends_on")
    .order("starts_on", { ascending: false });
  if (eventError) throw eventError;
  const eventId = requestedEventId || events?.[0]?.id || null;
  if (!eventId) return { module_ready: true, events: [], event_id: null, stages: [], results: [], overall: [] };

  const { data: stages, error: stageError } = await supabase
    .from("stages")
    .select("id, event_id, stage_number, name, route_label, stage_date, classification_weight, time_limit_s, results_published")
    .eq("event_id", eventId)
    .order("stage_number", { ascending: true });
  if (migrationMissing(stageError)) return {
    module_ready: false, events: events ?? [], event_id: eventId, stages: [], results: [], overall: [],
    message: "Execute a migration 011_official_classification.sql no Supabase.",
  };
  if (stageError) throw stageError;

  const { data: results, error: resultError } = await supabase
    .from("stage_results")
    .select("id, event_id, stage_id, athlete_id, registration_id, activity_id, full_name, bib_number, category, modality, official_time_s, manual_time_s, time_penalty_s, points_penalty, final_time_s, position, base_points, weighted_points, status, admin_note, calculated_at, published_at")
    .eq("event_id", eventId)
    .order("category", { ascending: true })
    .order("position", { ascending: true, nullsFirst: false });
  if (migrationMissing(resultError)) return {
    module_ready: false, events: events ?? [], event_id: eventId, stages: stages ?? [], results: [], overall: [],
    message: "Execute a migration 011_official_classification.sql no Supabase.",
  };
  if (resultError) throw resultError;

  const stageMap = new Map((stages ?? []).map((stage: any) => [stage.id, stage]));
  const enriched = (results ?? []).map((result: any) => ({ ...result, stage: stageMap.get(result.stage_id) ?? null }));
  const overall = buildOverallClassification((results ?? []).map((result: any) => {
    const stage: any = stageMap.get(result.stage_id);
    return {
      athlete_id: result.athlete_id, registration_id: result.registration_id, full_name: result.full_name,
      bib_number: result.bib_number, category: result.category, stage_id: result.stage_id,
      stage_number: Number(stage?.stage_number ?? 0), position: result.position,
      final_time_s: Number(result.final_time_s), weighted_points: Number(result.weighted_points), status: result.status,
    };
  }), (stages ?? []).length);
  return { module_ready: true, events: events ?? [], event_id: eventId, stages: stages ?? [], results: enriched, overall };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    return NextResponse.json(await getClassification(createSupabaseAdmin(), request.nextUrl.searchParams.get("eventId")));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar a classificação." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json() as { eventId?: string };
    const eventId = String(body.eventId ?? "").trim();
    if (!eventId) return NextResponse.json({ error: "Selecione o evento." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data: stages, error: stageError } = await supabase
      .from("stages")
      .select("id, event_id, stage_number, name, classification_weight, time_limit_s")
      .eq("event_id", eventId)
      .order("stage_number", { ascending: true });
    if (migrationMissing(stageError)) return NextResponse.json({ error: "Execute a migration 011_official_classification.sql no Supabase." }, { status: 409 });
    if (stageError) throw stageError;
    const stageIds = (stages ?? []).map((stage: any) => stage.id);
    if (!stageIds.length) return NextResponse.json({ error: "O evento não possui etapas cadastradas." }, { status: 422 });

    const { data: validations, error: validationError } = await supabase
      .from("validation_results")
      .select("id, activity_id, stage_id, status, updated_at")
      .in("stage_id", stageIds)
      .in("status", ["validated", "review"]);
    if (validationError) throw validationError;
    const activityIds = [...new Set((validations ?? []).map((validation: any) => validation.activity_id))];
    const { data: activities, error: activityError } = activityIds.length
      ? await supabase.from("activities").select("id, athlete_id, stage_id, moving_time_s, started_at, created_at").in("id", activityIds)
      : { data: [], error: null };
    if (activityError) throw activityError;
    const athleteIds = [...new Set((activities ?? []).map((activity: any) => activity.athlete_id))];
    const { data: registrations, error: registrationError } = athleteIds.length
      ? await supabase.from("registrations")
        .select("id, event_id, athlete_id, full_name, bib_number, category, modality, status, payment_status")
        .eq("event_id", eventId).in("athlete_id", athleteIds).eq("status", "confirmed").in("payment_status", ["paid", "courtesy"])
      : { data: [], error: null };
    if (registrationError) throw registrationError;

    const { data: checkpoints, error: checkpointError } = await supabase
      .from("checkpoints")
      .select("id, stage_id, sequence, checkpoint_kind")
      .in("stage_id", stageIds)
      .order("sequence", { ascending: true });
    if (checkpointError) throw checkpointError;
    const { data: passages, error: passageError } = activityIds.length
      ? await supabase.from("checkpoint_passages").select("activity_id, checkpoint_id, elapsed_s, passed_at").in("activity_id", activityIds)
      : { data: [], error: null };
    if (passageError) throw passageError;
    const { data: existing, error: existingError } = await supabase
      .from("stage_results")
      .select("*")
      .eq("event_id", eventId);
    if (migrationMissing(existingError)) return NextResponse.json({ error: "Execute a migration 011_official_classification.sql no Supabase." }, { status: 409 });
    if (existingError) throw existingError;

    const stageMap = new Map((stages ?? []).map((stage: any) => [stage.id, stage]));
    const activityMap = new Map((activities ?? []).map((activity: any) => [activity.id, activity]));
    const registrationMap = new Map((registrations ?? []).map((registration: any) => [registration.athlete_id, registration]));
    const existingMap = new Map((existing ?? []).map((result: any) => [`${result.stage_id}:${result.athlete_id}`, result]));
    const passageMap = new Map((passages ?? []).map((passage: any) => [`${passage.activity_id}:${passage.checkpoint_id}`, passage]));
    const checkpointsByStage = new Map<string, any[]>();
    for (const checkpoint of checkpoints ?? []) {
      const current = checkpointsByStage.get(checkpoint.stage_id) ?? [];
      current.push(checkpoint);
      checkpointsByStage.set(checkpoint.stage_id, current);
    }

    const bestCandidate = new Map<string, any>();
    for (const validation of validations ?? []) {
      const activity: any = activityMap.get(validation.activity_id);
      const stage: any = stageMap.get(validation.stage_id);
      const registration: any = activity ? registrationMap.get(activity.athlete_id) : null;
      if (!activity || !stage || !registration || registration.modality === "experience") continue;
      const stageCheckpoints = checkpointsByStage.get(stage.id) ?? [];
      const start = stageCheckpoints.find((checkpoint) => checkpoint.checkpoint_kind === "start") ?? stageCheckpoints[0];
      const finish = stageCheckpoints.find((checkpoint) => checkpoint.checkpoint_kind === "finish") ?? stageCheckpoints.at(-1);
      const startPassage: any = start ? passageMap.get(`${activity.id}:${start.id}`) : null;
      const finishPassage: any = finish ? passageMap.get(`${activity.id}:${finish.id}`) : null;
      const passageTime = startPassage && finishPassage ? Math.round(Number(finishPassage.elapsed_s) - Number(startPassage.elapsed_s)) : 0;
      const officialTime = passageTime > 0 ? passageTime : Math.round(Number(activity.moving_time_s ?? 0));
      if (officialTime <= 0) continue;
      const key = `${stage.id}:${activity.athlete_id}`;
      const current = bestCandidate.get(key);
      const candidate = { validation, activity, stage, registration, officialTime };
      const currentValidated = current?.validation.status === "validated";
      const candidateValidated = validation.status === "validated";
      if (!current || (candidateValidated && !currentValidated) || (candidateValidated === currentValidated && officialTime < current.officialTime)) bestCandidate.set(key, candidate);
    }

    const candidateByStage = new Map<string, StageClassificationInput[]>();
    const metaByKey = new Map<string, any>();
    for (const candidate of bestCandidate.values()) {
      const { stage, activity, registration, validation, officialTime } = candidate;
      const existingResult: any = existingMap.get(`${stage.id}:${activity.athlete_id}`);
      const manualTime = existingResult?.manual_time_s ? Number(existingResult.manual_time_s) : null;
      const timePenalty = Math.max(0, Number(existingResult?.time_penalty_s ?? 0));
      const input: StageClassificationInput = {
        id: existingResult?.id ?? `${stage.id}:${activity.athlete_id}`,
        athlete_id: activity.athlete_id,
        registration_id: registration.id,
        full_name: registration.full_name,
        category: registration.category || "Sem categoria",
        final_time_s: (manualTime ?? officialTime) + timePenalty,
        points_penalty: Math.max(0, Number(existingResult?.points_penalty ?? 0)),
        status: resultStatus(validation.status, existingResult?.status),
      };
      const current = candidateByStage.get(stage.id) ?? [];
      current.push(input);
      candidateByStage.set(stage.id, current);
      metaByKey.set(`${stage.id}:${activity.athlete_id}`, { candidate, existingResult, manualTime, timePenalty });
    }

    const rows: any[] = [];
    for (const stage of stages ?? []) {
      const classified = classifyStage(candidateByStage.get(stage.id) ?? [], Number(stage.classification_weight), stage.time_limit_s ? Number(stage.time_limit_s) : null);
      for (const result of classified) {
        const meta = metaByKey.get(`${stage.id}:${result.athlete_id}`);
        const { activity, registration, officialTime } = meta.candidate;
        rows.push({
          event_id: eventId, stage_id: stage.id, athlete_id: result.athlete_id, registration_id: registration.id,
          activity_id: activity.id, full_name: registration.full_name, bib_number: registration.bib_number,
          category: result.category, modality: registration.modality || "gravel_race", official_time_s: officialTime,
          manual_time_s: meta.manualTime, time_penalty_s: meta.timePenalty,
          points_penalty: Number(result.points_penalty ?? 0), final_time_s: result.final_time_s,
          position: result.position, base_points: result.base_points, weighted_points: result.weighted_points,
          status: result.status, admin_note: meta.existingResult?.admin_note ?? null,
          calculated_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
      }
    }
    if (rows.length) {
      const { error } = await supabase.from("stage_results").upsert(rows, { onConflict: "stage_id,athlete_id" });
      if (error) throw error;
    }
    return NextResponse.json({ recalculated: rows.length, event_id: eventId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao recalcular a classificação." }, { status: 500 });
  }
}
