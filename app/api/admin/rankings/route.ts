import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function normalizeAthleteName(value: unknown) {
  return String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const stageId = request.nextUrl.searchParams.get("stageId")?.trim() || null;
    const segmentId = request.nextUrl.searchParams.get("segmentId")?.trim() || null;
    const eventId = request.nextUrl.searchParams.get("eventId")?.trim() || null;
    const supabase = createSupabaseAdmin();

    let stageQuery = supabase
      .from("stages")
      .select("id, event_id, name, route_label, stage_date, stage_number");
    if (eventId) stageQuery = stageQuery.eq("event_id", eventId);
    const { data: stages, error: stageError } = await stageQuery.order("stage_date", { ascending: true });
    if (stageError) throw stageError;

    let segmentQuery = supabase
      .from("timed_segments")
      .select("id, stage_id, name, segment_type, start_checkpoint_id, finish_checkpoint_id, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (stageId) segmentQuery = segmentQuery.eq("stage_id", stageId);
    else if (eventId) {
      const stageIds = (stages ?? []).map((stage) => stage.id);
      if (!stageIds.length) return NextResponse.json({ module_ready: true, stages: [], segments: [], results: [] });
      segmentQuery = segmentQuery.in("stage_id", stageIds);
    }
    const { data: segments, error: segmentError } = await segmentQuery;
    if (segmentError) {
      return NextResponse.json({ module_ready: false, stages: stages ?? [], segments: [], results: [], message: "Execute a migration 005_checkpoint_segment_engine.sql no Supabase para habilitar os rankings." });
    }

    const selectedSegments = segmentId ? (segments ?? []).filter((segment) => segment.id === segmentId) : segments ?? [];
    const selectedSegmentIds = selectedSegments.map((segment) => segment.id);
    if (!selectedSegmentIds.length) return NextResponse.json({ module_ready: true, stages: stages ?? [], segments: segments ?? [], results: [] });

    const { data: segmentResults, error: resultError } = await supabase
      .from("segment_results")
      .select("id, activity_id, segment_id, start_passage_id, finish_passage_id, elapsed_s, status, created_at")
      .in("segment_id", selectedSegmentIds)
      .order("elapsed_s", { ascending: true });
    if (resultError) throw resultError;

    const activityIds = [...new Set((segmentResults ?? []).map((result) => result.activity_id))];
    const passageIds = [...new Set((segmentResults ?? []).flatMap((result) => [result.start_passage_id, result.finish_passage_id]))];
    const { data: activities, error: activityError } = activityIds.length
      ? await supabase.from("activities").select("id, athlete_id, stage_id, name, started_at, distance_km, elevation_m, source_activity_id").in("id", activityIds)
      : { data: [], error: null };
    if (activityError) throw activityError;

    const athleteIds = [...new Set((activities ?? []).map((activity) => activity.athlete_id))];
    const { data: athletes, error: athleteError } = athleteIds.length
      ? await supabase.from("athletes").select("id, full_name, category, country_code, ride_with_gps_user_id").in("id", athleteIds)
      : { data: [], error: null };
    if (athleteError) throw athleteError;

    const eventIds = [...new Set((stages ?? []).map((stage: any) => stage.event_id).filter(Boolean))];
    let registrations: any[] = [];
    if (athleteIds.length && eventIds.length) {
      const { data, error } = await supabase
        .from("registrations")
        .select("id, event_id, athlete_id, bib_number, full_name, category, modality, country_code, status")
        .in("athlete_id", athleteIds)
        .in("event_id", eventIds)
        .eq("status", "confirmed");
      if (!error) registrations = data ?? [];
      else if (error.code !== "42P01") throw error;
    }

    const { data: passages, error: passageError } = passageIds.length
      ? await supabase.from("checkpoint_passages").select("id, passed_at, elapsed_s, checkpoint_id").in("id", passageIds)
      : { data: [], error: null };
    if (passageError) throw passageError;

    const stageMap = new Map((stages ?? []).map((stage) => [stage.id, stage]));
    const segmentMap = new Map((segments ?? []).map((segment) => [segment.id, segment]));
    const activityMap = new Map((activities ?? []).map((activity) => [activity.id, activity]));
    const athleteMap = new Map((athletes ?? []).map((athlete) => [athlete.id, athlete]));
    const passageMap = new Map((passages ?? []).map((passage) => [passage.id, passage]));
    const registrationMap = new Map(registrations.map((registration) => [`${registration.event_id}:${registration.athlete_id}`, registration]));
    const enrichedResults = (segmentResults ?? []).map((result) => {
      const segment = segmentMap.get(result.segment_id);
      const stage: any = segment ? stageMap.get(segment.stage_id) : null;
      const activity = activityMap.get(result.activity_id);
      const athlete: any = activity ? athleteMap.get(activity.athlete_id) : null;
      const registration = activity && stage ? registrationMap.get(`${stage.event_id}:${activity.athlete_id}`) : null;
      const officialAthlete = athlete ? {
        ...athlete,
        full_name: registration?.full_name ?? athlete.full_name,
        category: registration?.category ?? athlete.category,
        country_code: registration?.country_code ?? athlete.country_code,
        bib_number: registration?.bib_number ?? null,
        modality: registration?.modality ?? null,
      } : null;
      return {
        ...result,
        segment,
        stage,
        activity,
        athlete: officialAthlete,
        registration,
        start_passage: passageMap.get(result.start_passage_id) ?? null,
        finish_passage: passageMap.get(result.finish_passage_id) ?? null,
      };
    });

    // Uma atividade antiga pode continuar ligada a um cadastro técnico sem número,
    // enquanto a atividade atual já está ligada à inscrição oficial. Quando isso
    // acontecer, a inscrição oficial é a identidade válida para o ranking.
    const officialNames = new Set(enrichedResults
      .filter((result) => result.registration && result.athlete?.full_name)
      .map((result) => `${result.segment_id}:${normalizeAthleteName(result.athlete.full_name)}`));
    const eligibleResults = enrichedResults.filter((result) => {
      if (result.registration || !result.athlete?.full_name) return true;
      return !officialNames.has(`${result.segment_id}:${normalizeAthleteName(result.athlete.full_name)}`);
    });

    // O atleta ocupa apenas uma posição por segmento. Se ele enviou mais de uma
    // atividade, fica o melhor resultado válido (ou o menor tempo em caso de empate).
    const bestByAthlete = new Map<string, (typeof eligibleResults)[number]>();
    for (const result of eligibleResults) {
      const identity = result.registration?.id
        ? `registration:${result.registration.id}`
        : result.athlete?.ride_with_gps_user_id
          ? `ridewithgps:${result.athlete.ride_with_gps_user_id}`
          : `athlete:${result.activity?.athlete_id ?? result.activity_id}`;
      const key = `${result.segment_id}:${identity}`;
      const current = bestByAthlete.get(key);
      const candidateIsValid = result.status === "valid";
      const currentIsValid = current?.status === "valid";
      if (!current || (candidateIsValid && !currentIsValid) || (candidateIsValid === currentIsValid && Number(result.elapsed_s) < Number(current.elapsed_s))) {
        bestByAthlete.set(key, result);
      }
    }

    const positionBySegment = new Map<string, number>();
    const results = [...bestByAthlete.values()]
      .sort((left, right) => Number(left.elapsed_s) - Number(right.elapsed_s))
      .map((result) => {
        const position = (positionBySegment.get(result.segment_id) ?? 0) + 1;
        positionBySegment.set(result.segment_id, position);
        return { ...result, position };
      });

    return NextResponse.json({ module_ready: true, stages: stages ?? [], segments: segments ?? [], results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar rankings." }, { status: 500 });
  }
}
