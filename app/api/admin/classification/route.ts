import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";
import { buildOverallClassification, classifyStage, StageClassificationInput } from "@/lib/classification-engine";
import { recordAdminAudit } from "@/lib/admin-audit";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function migrationMissing(error: any) {
  return error?.code === "42P01" || error?.code === "42703";
}

function resultStatus(
  validationStatus: string,
  existingStatus?: string | null,
  hasAdminDecision = false,
) {
  if (validationStatus === "review") return "review";
  if (["official", "disqualified"].includes(existingStatus ?? ""))
    return existingStatus as string;
  if (existingStatus === "dnf" && hasAdminDecision) return "dnf";
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
    message: "Execute as migrations 011_official_classification.sql e 027_proportional_classification.sql no Supabase.",
  };
  if (stageError) throw stageError;

  const { data: results, error: resultError } = await supabase
    .from("stage_results")
    .select("id, event_id, stage_id, athlete_id, registration_id, activity_id, full_name, bib_number, category, modality, official_time_s, manual_time_s, time_penalty_s, points_penalty, final_time_s, position, base_points, weighted_points, scoring_formula_version, status, admin_note, calculated_at, published_at")
    .eq("event_id", eventId)
    .order("category", { ascending: true })
    .order("position", { ascending: true, nullsFirst: false });
  if (migrationMissing(resultError)) return {
    module_ready: false, events: events ?? [], event_id: eventId, stages: stages ?? [], results: [], overall: [],
    message: "Execute as migrations 011_official_classification.sql e 027_proportional_classification.sql no Supabase.",
  };
  if (resultError) throw resultError;

  const resultActivityIds = [...new Set((results ?? []).map((result: any) => result.activity_id).filter(Boolean))];
  const stageIds = (stages ?? []).map((stage: any) => stage.id);
  const [{ data: checkpoints }, { data: passages }] = await Promise.all([
    stageIds.length
      ? supabase.from("checkpoints").select("id, stage_id, sequence, label, checkpoint_kind").in("stage_id", stageIds).order("sequence", { ascending: true })
      : Promise.resolve({ data: [] }),
    resultActivityIds.length
      ? supabase.from("checkpoint_passages").select("activity_id, checkpoint_id, elapsed_s, passed_at").in("activity_id", resultActivityIds)
      : Promise.resolve({ data: [] }),
  ]);

  const stageMap = new Map((stages ?? []).map((stage: any) => [stage.id, stage]));
  const checkpointMap = new Map((checkpoints ?? []).map((checkpoint: any) => [checkpoint.id, checkpoint]));
  const passagesByActivity = new Map<string, any[]>();
  for (const passage of passages ?? []) {
    const checkpoint: any = checkpointMap.get(passage.checkpoint_id);
    const current = passagesByActivity.get(passage.activity_id) ?? [];
    current.push({ ...passage, checkpoint });
    passagesByActivity.set(passage.activity_id, current);
  }
  const enriched = (results ?? []).map((result: any) => ({
    ...result,
    stage: stageMap.get(result.stage_id) ?? null,
    passages: (passagesByActivity.get(result.activity_id) ?? []).sort((left, right) => Number(left.checkpoint?.sequence ?? 0) - Number(right.checkpoint?.sequence ?? 0)),
  }));
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
  if (!isAdminRequest(request, "results.review")) return unauthorized();
  try {
    const body = await request.json() as { eventId?: string };
    const eventId = String(body.eventId ?? "").trim();
    if (!eventId) return NextResponse.json({ error: "Selecione o evento." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data: stages, error: stageError } = await supabase
      .from("stages")
      .select("id, event_id, stage_number, name, classification_weight, time_limit_s, results_locked")
      .eq("event_id", eventId)
      .order("stage_number", { ascending: true });
    if (migrationMissing(stageError)) return NextResponse.json({ error: "Execute as migrations 011_official_classification.sql e 027_proportional_classification.sql no Supabase." }, { status: 409 });
    if (stageError) throw stageError;
    if ((stages ?? []).some((stage: any) => stage.results_locked)) {
      return NextResponse.json({ error: "Há etapa publicada e bloqueada. Reabra a apuração antes de recalcular." }, { status: 423 });
    }
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
      ? await supabase.from("activities").select("id, athlete_id, stage_id, moving_time_s, started_at, created_at, raw_payload").in("id", activityIds)
      : { data: [], error: null };
    if (activityError) throw activityError;
    const { data: registrations, error: registrationError } = await supabase.from("registrations")
        .select("id, event_id, athlete_id, full_name, bib_number, category, modality, status, payment_status")
        .eq("event_id", eventId).eq("status", "confirmed").in("payment_status", ["paid", "courtesy"]);
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
    if (migrationMissing(existingError)) return NextResponse.json({ error: "Execute as migrations 011_official_classification.sql e 027_proportional_classification.sql no Supabase." }, { status: 409 });
    if (existingError) throw existingError;

    const stageMap = new Map((stages ?? []).map((stage: any) => [stage.id, stage]));
    const activityMap = new Map((activities ?? []).map((activity: any) => [activity.id, activity]));
    const registrationById = new Map((registrations ?? []).map((registration: any) => [registration.id, registration]));
    const registrationsByAthlete = new Map<string, any[]>();
    for (const registration of registrations ?? []) {
      if (!registration.athlete_id) continue;
      const current = registrationsByAthlete.get(registration.athlete_id) ?? [];
      current.push(registration);
      registrationsByAthlete.set(registration.athlete_id, current);
    }
    const existingMap = new Map((existing ?? []).map((result: any) => [`${result.stage_id}:${result.athlete_id}`, result]));
    const passageMap = new Map((passages ?? []).map((passage: any) => [`${passage.activity_id}:${passage.checkpoint_id}`, passage]));
    const checkpointsByStage = new Map<string, any[]>();
    for (const checkpoint of checkpoints ?? []) {
      const current = checkpointsByStage.get(checkpoint.stage_id) ?? [];
      current.push(checkpoint);
      checkpointsByStage.set(checkpoint.stage_id, current);
    }

    const bestCandidate = new Map<string, any>();
    const excluded = { missing_activity: 0, missing_registration: 0, experience: 0, missing_passages: 0 };
    for (const validation of validations ?? []) {
      const activity: any = activityMap.get(validation.activity_id);
      const stage: any = stageMap.get(validation.stage_id);
      if (!activity || !stage) { excluded.missing_activity += 1; continue; }
      const explicitRegistrationId = String(activity.raw_payload?.registration_id ?? "");
      const registration: any = registrationById.get(explicitRegistrationId)
        ?? (registrationsByAthlete.get(activity.athlete_id)?.length === 1 ? registrationsByAthlete.get(activity.athlete_id)?.[0] : null);
      if (!registration) { excluded.missing_registration += 1; continue; }
      if (registration.modality === "experience") { excluded.experience += 1; continue; }
      const stageCheckpoints = checkpointsByStage.get(stage.id) ?? [];
      const start = stageCheckpoints.find((checkpoint) => checkpoint.checkpoint_kind === "start") ?? stageCheckpoints[0];
      const finish = stageCheckpoints.find((checkpoint) => checkpoint.checkpoint_kind === "finish") ?? stageCheckpoints.at(-1);
      const startPassage: any = start ? passageMap.get(`${activity.id}:${start.id}`) : null;
      const finishPassage: any = finish ? passageMap.get(`${activity.id}:${finish.id}`) : null;
      const passageTime = startPassage && finishPassage ? Math.round(Number(finishPassage.elapsed_s) - Number(startPassage.elapsed_s)) : 0;
      if (passageTime <= 0) { excluded.missing_passages += 1; continue; }
      const officialTime = passageTime;
      const key = `${stage.id}:${registration.id}`;
      const current = bestCandidate.get(key);
      const candidate = { validation, activity, stage, registration, officialTime };
      const currentValidated = current?.validation.status === "validated";
      const candidateValidated = validation.status === "validated";
      const candidateUpdatedAt = new Date(validation.updated_at ?? 0).getTime();
      const currentUpdatedAt = new Date(current?.validation.updated_at ?? 0).getTime();
      if (
        !current ||
        (candidateValidated && !currentValidated) ||
        (candidateValidated === currentValidated && officialTime < current.officialTime) ||
        (candidateValidated === currentValidated &&
          officialTime === current.officialTime &&
          candidateUpdatedAt > currentUpdatedAt)
      )
        bestCandidate.set(key, candidate);
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
        status: resultStatus(
          validation.status,
          existingResult?.status,
          Boolean(existingResult?.admin_note),
        ),
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
          scoring_formula_version: "proportional_v1",
          status: result.status, admin_note: meta.existingResult?.admin_note ?? null,
          calculated_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
      }
    }
    if (rows.length) {
      const { error } = await supabase.from("stage_results").upsert(rows, { onConflict: "stage_id,athlete_id" });
      if (error) throw error;
    }
    const currentResultKeys = new Set(
      rows.map((row) => `${row.stage_id}:${row.athlete_id}`),
    );
    const staleResultIds = (existing ?? [])
      .filter(
        (result: any) =>
          !currentResultKeys.has(`${result.stage_id}:${result.athlete_id}`) &&
          ["provisional", "review", "dnf"].includes(result.status),
      )
      .map((result: any) => result.id);
    if (staleResultIds.length) {
      const { error: staleError } = await supabase
        .from("stage_results")
        .delete()
        .in("id", staleResultIds);
      if (staleError) throw staleError;
    }
    await recordAdminAudit(request, {
      action: "classification.recalculated",
      resourceType: "event",
      resourceId: eventId,
      eventId,
      details: {
        recalculated_results: rows.length,
        stale_results_removed: staleResultIds.length,
        excluded,
        scoring_formula_version: "proportional_v1",
      },
    });
    return NextResponse.json({
      recalculated: rows.length,
      stale_removed: staleResultIds.length,
      event_id: eventId,
      excluded,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao recalcular a classificação." }, { status: 500 });
  }
}
