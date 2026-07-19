import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const stageId = request.nextUrl.searchParams.get("stageId")?.trim() || null;
    const segmentId = request.nextUrl.searchParams.get("segmentId")?.trim() || null;
    const supabase = createSupabaseAdmin();

    const { data: stages, error: stageError } = await supabase
      .from("stages")
      .select("id, name, route_label, stage_date, stage_number")
      .order("stage_date", { ascending: true });
    if (stageError) throw stageError;

    let segmentQuery = supabase
      .from("timed_segments")
      .select("id, stage_id, name, segment_type, start_checkpoint_id, finish_checkpoint_id, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (stageId) segmentQuery = segmentQuery.eq("stage_id", stageId);
    const { data: segments, error: segmentError } = await segmentQuery;
    if (segmentError) {
      return NextResponse.json({
        module_ready: false,
        stages: stages ?? [],
        segments: [],
        results: [],
        message: "Execute a migration 005_checkpoint_segment_engine.sql no Supabase para habilitar os rankings.",
      });
    }

    const selectedSegments = segmentId ? (segments ?? []).filter((segment) => segment.id === segmentId) : segments ?? [];
    const selectedSegmentIds = selectedSegments.map((segment) => segment.id);
    if (!selectedSegmentIds.length) {
      return NextResponse.json({ module_ready: true, stages: stages ?? [], segments: segments ?? [], results: [] });
    }

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
      ? await supabase.from("athletes").select("id, full_name, category, country_code, strava_athlete_id").in("id", athleteIds)
      : { data: [], error: null };
    if (athleteError) throw athleteError;

    const { data: passages, error: passageError } = passageIds.length
      ? await supabase.from("checkpoint_passages").select("id, passed_at, elapsed_s, checkpoint_id").in("id", passageIds)
      : { data: [], error: null };
    if (passageError) throw passageError;

    const stageMap = new Map((stages ?? []).map((stage) => [stage.id, stage]));
    const segmentMap = new Map((segments ?? []).map((segment) => [segment.id, segment]));
    const activityMap = new Map((activities ?? []).map((activity) => [activity.id, activity]));
    const athleteMap = new Map((athletes ?? []).map((athlete) => [athlete.id, athlete]));
    const passageMap = new Map((passages ?? []).map((passage) => [passage.id, passage]));
    const positionBySegment = new Map<string, number>();

    const results = (segmentResults ?? []).map((result) => {
      const position = (positionBySegment.get(result.segment_id) ?? 0) + 1;
      positionBySegment.set(result.segment_id, position);
      const segment = segmentMap.get(result.segment_id);
      const activity = activityMap.get(result.activity_id);
      const athlete = activity ? athleteMap.get(activity.athlete_id) : null;
      return {
        ...result,
        position,
        segment,
        stage: segment ? stageMap.get(segment.stage_id) : null,
        activity,
        athlete,
        start_passage: passageMap.get(result.start_passage_id) ?? null,
        finish_passage: passageMap.get(result.finish_passage_id) ?? null,
      };
    });

    return NextResponse.json({ module_ready: true, stages: stages ?? [], segments: segments ?? [], results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar rankings." }, { status: 500 });
  }
}
