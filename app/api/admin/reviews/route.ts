import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function sample(points: any[], max = 2500) {
  if (!Array.isArray(points)) return [];
  if (points.length <= max) return points.map((point) => [point[0], point[1]]);
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, index) => {
    const point = points[Math.round(index * step)];
    return [point[0], point[1]];
  });
}

function distanceM(a: [number, number], b: [number, number]) {
  const radius = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(value)));
}

function checkpointResult(checkpoint: any, points: any[], passage?: any) {
  let nearest = Number.POSITIVE_INFINITY;
  for (const point of points ?? []) {
    const value = distanceM([checkpoint.latitude, checkpoint.longitude], [point[0], point[1]]);
    if (value < nearest) nearest = value;
    if (nearest < 5) break;
  }
  return {
    ...checkpoint,
    hit: passage ? true : nearest <= checkpoint.radius_m,
    nearest_distance_m: passage?.nearest_distance_m ?? (Number.isFinite(nearest) ? Math.round(nearest) : 0),
    passed_at: passage?.passed_at ?? null,
    elapsed_s: passage?.elapsed_s ?? null,
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const eventId = request.nextUrl.searchParams.get("eventId")?.trim() ?? "";
    const supabase = createSupabaseAdmin();
    let eventStageIds: string[] | null = null;
    if (eventId) {
      const { data: eventStages, error: eventStageError } = await supabase.from("stages").select("id").eq("event_id", eventId);
      if (eventStageError) throw eventStageError;
      eventStageIds = (eventStages ?? []).map((stage) => stage.id);
      if (!eventStageIds.length) return NextResponse.json({ summary: { total: 0, validated: 0, review: 0, rejected: 0, pending: 0 }, items: [] });
    }
    let validationQuery = supabase
      .from("validation_results")
      .select("id, activity_id, stage_id, status, coverage_percent, start_ok, finish_ok, direction_ok, checkpoints_passed, checkpoints_total, max_deviation_m, notes, validated_at, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (eventStageIds) validationQuery = validationQuery.in("stage_id", eventStageIds);
    const { data: validations, error } = await validationQuery;
    if (error) throw error;

    const activityIds = [...new Set((validations ?? []).map((validation) => validation.activity_id))];
    const stageIds = [...new Set((validations ?? []).map((validation) => validation.stage_id))];
    const { data: activities, error: activityError } = activityIds.length
      ? await supabase.from("activities").select("id, athlete_id, stage_id, source, source_activity_id, name, started_at, distance_km, elevation_m, moving_time_s, gps_points, created_at").in("id", activityIds)
      : { data: [], error: null };
    if (activityError) throw activityError;

    const athleteIds = [...new Set((activities ?? []).map((activity) => activity.athlete_id))];
    const { data: athletes, error: athleteError } = athleteIds.length
      ? await supabase.from("athletes").select("id, full_name, ride_with_gps_user_id, category, country_code").in("id", athleteIds)
      : { data: [], error: null };
    if (athleteError) throw athleteError;

    const { data: stages, error: stageError } = stageIds.length
      ? await supabase.from("stages").select("id, name, route_label, stage_date, distance_km, elevation_m").in("id", stageIds)
      : { data: [], error: null };
    if (stageError) throw stageError;

    const { data: routes, error: routeError } = stageIds.length
      ? await supabase.from("route_versions").select("id, stage_id, version, file_name, route_points, is_active").in("stage_id", stageIds).eq("is_active", true)
      : { data: [], error: null };
    if (routeError) throw routeError;

    const { data: checkpoints, error: checkpointError } = stageIds.length
      ? await supabase.from("checkpoints").select("*").in("stage_id", stageIds).order("sequence", { ascending: true })
      : { data: [], error: null };
    if (checkpointError) throw checkpointError;

    let passages: any[] = [];
    let segmentResults: any[] = [];
    let timedSegments: any[] = [];
    if (activityIds.length) {
      const passageQuery = await supabase
        .from("checkpoint_passages")
        .select("id, activity_id, checkpoint_id, elapsed_s, activity_distance_m, nearest_distance_m, passed_at")
        .in("activity_id", activityIds)
        .order("elapsed_s", { ascending: true });
      if (!passageQuery.error) {
        passages = passageQuery.data ?? [];
        const segmentQuery = await supabase
          .from("segment_results")
          .select("id, activity_id, segment_id, elapsed_s, status")
          .in("activity_id", activityIds)
          .order("elapsed_s", { ascending: true });
        segmentResults = segmentQuery.data ?? [];
        const segmentIds = [...new Set(segmentResults.map((result) => result.segment_id))];
        if (segmentIds.length) {
          const timedQuery = await supabase.from("timed_segments").select("id, name, segment_type, stage_id, start_checkpoint_id, finish_checkpoint_id").in("id", segmentIds);
          timedSegments = timedQuery.data ?? [];
        }
      }
    }

    const activityMap = new Map((activities ?? []).map((activity) => [activity.id, activity]));
    const athleteMap = new Map((athletes ?? []).map((athlete) => [athlete.id, athlete]));
    const stageMap = new Map((stages ?? []).map((stage) => [stage.id, stage]));
    const routeMap = new Map((routes ?? []).map((route) => [route.stage_id, route]));
    const passageByActivityAndCheckpoint = new Map(passages.map((passage) => [`${passage.activity_id}:${passage.checkpoint_id}`, passage]));
    const segmentMap = new Map(timedSegments.map((segment) => [segment.id, segment]));
    const segmentsByActivity = new Map<string, any[]>();
    for (const result of segmentResults) {
      const current = segmentsByActivity.get(result.activity_id) ?? [];
      current.push({ ...result, segment: segmentMap.get(result.segment_id) ?? null });
      segmentsByActivity.set(result.activity_id, current);
    }

    const items = (validations ?? []).map((validation) => {
      const activity: any = activityMap.get(validation.activity_id);
      const athlete = activity ? athleteMap.get(activity.athlete_id) : null;
      const stage = stageMap.get(validation.stage_id);
      const route: any = routeMap.get(validation.stage_id);
      const rawPoints = activity?.gps_points ?? [];
      const stageCheckpoints = (checkpoints ?? [])
        .filter((checkpoint) => checkpoint.stage_id === validation.stage_id)
        .map((checkpoint) => checkpointResult(checkpoint, rawPoints, passageByActivityAndCheckpoint.get(`${validation.activity_id}:${checkpoint.id}`)));
      return {
        ...validation,
        activity: activity ? { ...activity, gps_points: sample(rawPoints) } : null,
        athlete,
        stage,
        route: route ? { ...route, route_points: sample(route.route_points) } : null,
        checkpoints: stageCheckpoints,
        passages: passages.filter((passage) => passage.activity_id === validation.activity_id),
        segment_results: segmentsByActivity.get(validation.activity_id) ?? [],
      };
    });

    const summary = {
      total: items.length,
      validated: items.filter((item) => item.status === "validated").length,
      review: items.filter((item) => item.status === "review").length,
      rejected: items.filter((item) => item.status === "rejected").length,
      pending: items.filter((item) => item.status === "pending").length,
    };
    return NextResponse.json({ summary, items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar revisões." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json() as { validationId?: string; decision?: "validated" | "rejected" | "review"; note?: string };
    const validationId = String(body.validationId ?? "");
    const decision = body.decision;
    const note = String(body.note ?? "").trim();
    if (!validationId || !decision || !["validated", "rejected", "review"].includes(decision)) {
      return NextResponse.json({ error: "Decisão inválida." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from("validation_results")
      .select("id, activity_id, notes")
      .eq("id", validationId)
      .single();
    if (currentError || !current) return NextResponse.json({ error: "Validação não encontrada." }, { status: 404 });

    const label = decision === "validated" ? "APROVADA" : decision === "rejected" ? "REJEITADA" : "MANTIDA EM REVISÃO";
    const decisionText = `DECISÃO DA ORGANIZAÇÃO (${new Date().toLocaleString("pt-BR")}): ${label}${note ? ` — ${note}` : ""}`;
    const notes = [current.notes, decisionText].filter(Boolean).join("\n\n");
    const { error: updateError } = await supabase
      .from("validation_results")
      .update({ status: decision, notes, validated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", validationId);
    if (updateError) throw updateError;

    const segmentStatus = decision === "validated" ? "valid" : decision === "rejected" ? "invalid" : "review";
    await supabase.from("segment_results").update({ status: segmentStatus, updated_at: new Date().toISOString() }).eq("activity_id", current.activity_id);
    return NextResponse.json({ updated: true, status: decision });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao registrar decisão." }, { status: 500 });
  }
}
