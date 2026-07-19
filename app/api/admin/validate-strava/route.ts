import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { GeoPoint, validateActivity } from "@/lib/race-engine";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  buildFallbackDistanceStream,
  calculateSegmentResults,
  detectCheckpointPassages,
  type TimedSegment,
  type TimingCheckpoint,
} from "@/lib/checkpoint-engine";

export const runtime = "nodejs";

type RefreshResponse = { access_token: string; refresh_token: string; expires_at: number; expires_in: number };
type StravaAthleteCookie = { id?: number; firstname?: string; lastname?: string; profile?: string };
type StravaActivityDetail = {
  id: number;
  name: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  total_elevation_gain: number;
  moving_time: number;
  elapsed_time: number;
  average_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  calories?: number;
  sport_type?: string;
  type?: string;
  athlete?: { id?: number };
};
type StravaStream<T> = { data: T[]; original_size?: number; resolution?: string; series_type?: string };
type StravaStreams = {
  latlng?: StravaStream<[number, number]>;
  altitude?: StravaStream<number>;
  time?: StravaStream<number>;
  distance?: StravaStream<number>;
};

async function resolveAccessToken(request: NextRequest) {
  let accessToken = request.cookies.get("strava_access_token")?.value;
  const refreshToken = request.cookies.get("strava_refresh_token")?.value;
  const expiresAt = Number(request.cookies.get("strava_expires_at")?.value || 0);
  if (accessToken && expiresAt > Math.floor(Date.now() / 1000) + 300) return { accessToken, refreshed: null as RefreshResponse | null };
  const clientId = process.env.STRAVA_CLIENT_ID?.trim();
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim();
  if (!refreshToken || !clientId || !clientSecret) return { accessToken: null, refreshed: null as RefreshResponse | null };
  const refreshResponse = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", refresh_token: refreshToken }),
    cache: "no-store",
  });
  if (!refreshResponse.ok) return { accessToken: null, refreshed: null as RefreshResponse | null };
  const refreshed = await refreshResponse.json() as RefreshResponse;
  return { accessToken: refreshed.access_token, refreshed };
}

function applyRefreshedCookies(response: NextResponse, refreshed: RefreshResponse | null) {
  if (!refreshed) return;
  const base = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  response.cookies.set("strava_access_token", refreshed.access_token, { ...base, maxAge: Math.max(60, refreshed.expires_in || 21600) });
  response.cookies.set("strava_refresh_token", refreshed.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 365 });
  response.cookies.set("strava_expires_at", String(refreshed.expires_at || 0), { ...base, maxAge: 60 * 60 * 24 * 365 });
}

function readAthleteCookie(request: NextRequest): StravaAthleteCookie | null {
  const value = request.cookies.get("strava_athlete")?.value;
  if (!value) return null;
  try { return JSON.parse(value) as StravaAthleteCookie; } catch { return null; }
}

function sampleMapPoints(points: GeoPoint[], maxPoints = 2500): Array<[number, number]> {
  if (points.length <= maxPoints) return points.map((point) => [point[0], point[1]]);
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => {
    const point = points[Math.round(index * step)];
    return [point[0], point[1]] as [number, number];
  });
}

function normalizedStream(values: number[], length: number, fallbackFinish: number) {
  if (values.length === length) return values.map((value) => Number(value));
  if (length <= 1) return [0];
  return Array.from({ length }, (_, index) => (index / (length - 1)) * fallbackFinish);
}

export async function POST(request: NextRequest) {
  const athleteCookie = readAthleteCookie(request);
  if (!isAdminRequest(request) && !athleteCookie?.id) return NextResponse.json({ error: "Sessão inválida ou expirada." }, { status: 401 });

  try {
    const body = await request.json() as { stageId?: string; activityId?: string; toleranceM?: number };
    const stageId = String(body.stageId ?? "").trim();
    const activityId = String(body.activityId ?? "").trim();
    const toleranceM = Number(body.toleranceM ?? 120);
    if (!stageId || !activityId) return NextResponse.json({ error: "Selecione uma etapa e uma atividade do Strava." }, { status: 400 });

    const { accessToken, refreshed } = await resolveAccessToken(request);
    if (!accessToken) return NextResponse.json({ error: "Conecte novamente sua conta do Strava." }, { status: 401 });
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [activityResponse, streamsResponse] = await Promise.all([
      fetch(`https://www.strava.com/api/v3/activities/${encodeURIComponent(activityId)}`, { headers, cache: "no-store" }),
      fetch(`https://www.strava.com/api/v3/activities/${encodeURIComponent(activityId)}/streams?keys=latlng,altitude,time,distance&key_by_type=true`, { headers, cache: "no-store" }),
    ]);
    if (!activityResponse.ok) return NextResponse.json({ error: "Não foi possível consultar os dados da atividade no Strava." }, { status: activityResponse.status });
    if (!streamsResponse.ok) return NextResponse.json({ error: "Não foi possível consultar o traçado GPS da atividade no Strava." }, { status: streamsResponse.status });

    const activity = await activityResponse.json() as StravaActivityDetail;
    const streams = await streamsResponse.json() as StravaStreams;
    const latlng = streams.latlng?.data ?? [];
    const altitude = streams.altitude?.data ?? [];
    if (latlng.length < 2) return NextResponse.json({ error: "Esta atividade não possui pontos GPS disponíveis." }, { status: 422 });
    if (athleteCookie?.id && activity.athlete?.id && athleteCookie.id !== activity.athlete.id) {
      return NextResponse.json({ error: "Esta atividade não pertence à conta conectada." }, { status: 403 });
    }

    const activityPoints: GeoPoint[] = latlng.map((point, index) => [point[0], point[1], Number.isFinite(altitude[index]) ? altitude[index] : null]);
    const elapsedSeconds = normalizedStream(streams.time?.data ?? [], activityPoints.length, activity.elapsed_time || activity.moving_time || 0);
    const distanceStream = streams.distance?.data?.length === activityPoints.length
      ? streams.distance.data.map((value) => Number(value))
      : buildFallbackDistanceStream(activityPoints);

    const supabase = createSupabaseAdmin();
    const { data: route, error: routeError } = await supabase
      .from("route_versions")
      .select("id, version, file_name, distance_km, elevation_m, route_points")
      .eq("stage_id", stageId)
      .eq("is_active", true)
      .single();
    if (routeError || !route) return NextResponse.json({ error: routeError?.message ?? "A etapa não possui rota oficial ativa." }, { status: 404 });
    const officialPoints = (route.route_points ?? []) as GeoPoint[];
    if (officialPoints.length < 2) return NextResponse.json({ error: "A versão oficial não possui pontos válidos." }, { status: 422 });

    const { data: checkpoints, error: checkpointError } = await supabase
      .from("checkpoints")
      .select("*")
      .eq("stage_id", stageId)
      .order("sequence", { ascending: true });
    if (checkpointError) throw checkpointError;

    const report = validateActivity({
      officialPoints,
      activityPoints,
      checkpoints: (checkpoints ?? []) as TimingCheckpoint[],
      toleranceM: Number.isFinite(toleranceM) ? Math.min(300, Math.max(40, toleranceM)) : 120,
    });

    const stravaAthleteId = athleteCookie?.id ?? activity.athlete?.id;
    if (!stravaAthleteId) return NextResponse.json({ error: "Atleta do Strava não identificado." }, { status: 422 });
    const fullName = `${athleteCookie?.firstname ?? ""} ${athleteCookie?.lastname ?? ""}`.trim() || `Atleta Strava ${stravaAthleteId}`;
    const { data: athleteRow, error: athleteError } = await supabase
      .from("athletes")
      .upsert({ strava_athlete_id: stravaAthleteId, full_name: fullName }, { onConflict: "strava_athlete_id" })
      .select("id")
      .single();
    if (athleteError) throw athleteError;

    const { data: activityRow, error: activityError } = await supabase
      .from("activities")
      .upsert({
        athlete_id: athleteRow.id,
        stage_id: stageId,
        source: "strava",
        source_activity_id: String(activity.id),
        name: activity.name,
        started_at: activity.start_date,
        distance_km: Number((activity.distance / 1000).toFixed(3)),
        elevation_m: Math.round(activity.total_elevation_gain || 0),
        moving_time_s: activity.moving_time,
        avg_speed_kmh: activity.average_speed ? Number((activity.average_speed * 3.6).toFixed(2)) : null,
        avg_heart_rate: activity.average_heartrate ?? null,
        avg_watts: activity.average_watts ?? null,
        gps_points: activityPoints,
        raw_payload: activity,
      }, { onConflict: "source,source_activity_id" })
      .select("id")
      .single();
    if (activityError) throw activityError;

    const status = report.status === "manual_review" ? "review" : report.status;
    const maxDeviation = report.checkpoint_results.reduce((maximum, checkpoint) => Math.max(maximum, checkpoint.nearest_distance_m), 0);
    const { data: validation, error: validationError } = await supabase
      .from("validation_results")
      .upsert({
        activity_id: activityRow.id,
        stage_id: stageId,
        status,
        coverage_percent: report.coverage_percent,
        start_ok: report.start_ok,
        finish_ok: report.finish_ok,
        direction_ok: report.direction_ok,
        checkpoints_passed: report.checkpoints_hit,
        checkpoints_total: report.checkpoints_total,
        max_deviation_m: maxDeviation,
        notes: report.notes.join("\n"),
        validated_at: new Date().toISOString(),
      }, { onConflict: "activity_id" })
      .select("id,status")
      .single();
    if (validationError) throw validationError;

    const passageDetections = detectCheckpointPassages({
      activityPoints,
      elapsedSeconds,
      activityDistanceMeters: distanceStream,
      startedAt: activity.start_date,
      checkpoints: (checkpoints ?? []) as TimingCheckpoint[],
    });

    let timingConfigured = false;
    let timingMessage: string | null = null;
    let timedSegments: TimedSegment[] = [];
    let segmentDetections = [] as ReturnType<typeof calculateSegmentResults>;

    const { data: segmentRows, error: segmentQueryError } = await supabase
      .from("timed_segments")
      .select("id, name, segment_type, start_checkpoint_id, finish_checkpoint_id")
      .eq("stage_id", stageId)
      .eq("is_active", true);

    if (!segmentQueryError) {
      timingConfigured = true;
      timedSegments = (segmentRows ?? []) as TimedSegment[];
      segmentDetections = calculateSegmentResults(timedSegments, passageDetections);

      const { error: passageDeleteError } = await supabase.from("checkpoint_passages").delete().eq("activity_id", activityRow.id);
      if (passageDeleteError) throw passageDeleteError;
      const passed = passageDetections.filter((passage) => passage.passed && passage.point_index !== null && passage.elapsed_s !== null && passage.passed_at);
      let savedPassages: Array<{ id: string; checkpoint_id: string }> = [];
      if (passed.length) {
        const { data, error } = await supabase
          .from("checkpoint_passages")
          .insert(passed.map((passage) => ({
            activity_id: activityRow.id,
            checkpoint_id: passage.checkpoint_id,
            point_index: passage.point_index,
            elapsed_s: passage.elapsed_s,
            activity_distance_m: passage.activity_distance_m,
            nearest_distance_m: passage.nearest_distance_m,
            passed_at: passage.passed_at,
          })))
          .select("id, checkpoint_id");
        if (error) throw error;
        savedPassages = data ?? [];
      }

      const passageIdByCheckpoint = new Map(savedPassages.map((passage) => [passage.checkpoint_id, passage.id]));
      const completedSegments = segmentDetections.filter((segment) => segment.completed && segment.elapsed_s !== null);
      if (completedSegments.length) {
        const { error } = await supabase.from("segment_results").insert(completedSegments.map((segment) => ({
          activity_id: activityRow.id,
          segment_id: segment.segment_id,
          start_passage_id: passageIdByCheckpoint.get(segment.start_checkpoint_id),
          finish_passage_id: passageIdByCheckpoint.get(segment.finish_checkpoint_id),
          elapsed_s: segment.elapsed_s,
          status: status === "validated" ? "valid" : "review",
        })));
        if (error) throw error;
      }
    } else {
      timingMessage = "Cronometragem de checkpoints aguardando a migration 005 no Supabase.";
    }

    const passageByCheckpoint = new Map(passageDetections.map((passage) => [passage.checkpoint_id, passage]));
    const response = NextResponse.json({
      report,
      validation,
      route: { id: route.id, version: route.version, file_name: route.file_name, distance_km: route.distance_km, elevation_m: route.elevation_m },
      activity: {
        id: String(activity.id),
        database_id: activityRow.id,
        name: activity.name,
        file_name: activity.name,
        source: "Strava",
        start_date: activity.start_date,
        start_date_local: activity.start_date_local,
        distance_km: Number((activity.distance / 1000).toFixed(2)),
        elevation_m: Math.round(activity.total_elevation_gain || 0),
        moving_time_min: Math.round(activity.moving_time / 60),
        points_count: activityPoints.length,
      },
      map: {
        official_points: sampleMapPoints(officialPoints),
        activity_points: sampleMapPoints(activityPoints),
        checkpoints: report.checkpoint_results.map((checkpoint) => ({
          sequence: checkpoint.sequence,
          label: checkpoint.label,
          latitude: checkpoint.latitude,
          longitude: checkpoint.longitude,
          hit: checkpoint.hit,
          nearest_distance_m: checkpoint.nearest_distance_m,
          passed_at: checkpoint.id ? passageByCheckpoint.get(checkpoint.id)?.passed_at ?? null : null,
          elapsed_s: checkpoint.id ? passageByCheckpoint.get(checkpoint.id)?.elapsed_s ?? null : null,
        })),
      },
      timing: {
        configured: timingConfigured,
        message: timingMessage,
        passages: passageDetections,
        segments: segmentDetections,
      },
      saved: true,
    });
    applyRefreshedCookies(response, refreshed);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao validar a atividade." }, { status: 500 });
  }
}
