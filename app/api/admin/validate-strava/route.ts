import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { GeoPoint, validateActivity } from "@/lib/race-engine";

export const runtime = "nodejs";

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
};

type StravaAthleteCookie = {
  id?: number;
  firstname?: string;
  lastname?: string;
  profile?: string;
};

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

  if (accessToken && expiresAt > Math.floor(Date.now() / 1000) + 300) {
    return { accessToken, refreshed: null as RefreshResponse | null };
  }

  const clientId = process.env.STRAVA_CLIENT_ID?.trim();
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim();
  if (!refreshToken || !clientId || !clientSecret) {
    return { accessToken: null, refreshed: null as RefreshResponse | null };
  }

  const refreshResponse = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!refreshResponse.ok) return { accessToken: null, refreshed: null as RefreshResponse | null };
  const refreshed = (await refreshResponse.json()) as RefreshResponse;
  accessToken = refreshed.access_token;
  return { accessToken, refreshed };
}

function applyRefreshedCookies(response: NextResponse, refreshed: RefreshResponse | null) {
  if (!refreshed) return;
  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set("strava_access_token", refreshed.access_token, {
    ...cookieBase,
    maxAge: Math.max(60, refreshed.expires_in || 21600),
  });
  response.cookies.set("strava_refresh_token", refreshed.refresh_token, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 365,
  });
  response.cookies.set("strava_expires_at", String(refreshed.expires_at || 0), {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 365,
  });
}

function readAthleteCookie(request: NextRequest): StravaAthleteCookie | null {
  const value = request.cookies.get("strava_athlete")?.value;
  if (!value) return null;
  try {
    return JSON.parse(value) as StravaAthleteCookie;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { stageId?: string; activityId?: string; toleranceM?: number };
    const stageId = String(body.stageId ?? "").trim();
    const activityId = String(body.activityId ?? "").trim();
    const toleranceM = Number(body.toleranceM ?? 120);

    if (!stageId || !activityId) {
      return NextResponse.json({ error: "Selecione uma etapa e uma atividade do Strava." }, { status: 400 });
    }

    const { accessToken, refreshed } = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Conecte novamente sua conta do Strava." }, { status: 401 });
    }

    const headers = { Authorization: `Bearer ${accessToken}` };
    const [activityResponse, streamsResponse] = await Promise.all([
      fetch(`https://www.strava.com/api/v3/activities/${encodeURIComponent(activityId)}`, {
        headers,
        cache: "no-store",
      }),
      fetch(
        `https://www.strava.com/api/v3/activities/${encodeURIComponent(activityId)}/streams?keys=latlng,altitude,time,distance&key_by_type=true`,
        { headers, cache: "no-store" },
      ),
    ]);

    if (!activityResponse.ok) {
      return NextResponse.json({ error: "Não foi possível consultar os dados da atividade no Strava." }, { status: activityResponse.status });
    }
    if (!streamsResponse.ok) {
      return NextResponse.json({ error: "Não foi possível consultar o traçado GPS da atividade no Strava." }, { status: streamsResponse.status });
    }

    const activity = (await activityResponse.json()) as StravaActivityDetail;
    const streams = (await streamsResponse.json()) as StravaStreams;
    const latlng = streams.latlng?.data ?? [];
    const altitude = streams.altitude?.data ?? [];

    if (latlng.length < 2) {
      return NextResponse.json(
        { error: "Esta atividade não possui pontos GPS disponíveis. Atividades de rolo ou ocultadas não podem ser homologadas pela rota." },
        { status: 422 },
      );
    }

    const activityPoints: GeoPoint[] = latlng.map((point, index) => [
      point[0],
      point[1],
      Number.isFinite(altitude[index]) ? altitude[index] : null,
    ]);

    const supabase = createSupabaseAdmin();
    const { data: route, error: routeError } = await supabase
      .from("route_versions")
      .select("id, version, file_name, distance_km, elevation_m, route_points")
      .eq("stage_id", stageId)
      .eq("is_active", true)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: routeError?.message ?? "A etapa não possui uma rota oficial ativa." },
        { status: 404 },
      );
    }

    const officialPoints = (route.route_points ?? []) as GeoPoint[];
    if (officialPoints.length < 2) {
      return NextResponse.json({ error: "A versão oficial não possui pontos de rota válidos." }, { status: 422 });
    }

    const { data: checkpoints, error: checkpointError } = await supabase
      .from("checkpoints")
      .select("id, sequence, label, latitude, longitude, radius_m")
      .eq("stage_id", stageId)
      .order("sequence", { ascending: true });
    if (checkpointError) throw checkpointError;

    const report = validateActivity({
      officialPoints,
      activityPoints,
      checkpoints: checkpoints ?? [],
      toleranceM: Number.isFinite(toleranceM) ? Math.min(300, Math.max(40, toleranceM)) : 120,
    });

    const athleteCookie = readAthleteCookie(request);
    const stravaAthleteId = athleteCookie?.id ?? activity.athlete?.id;
    let saved = false;
    let databaseActivityId: string | null = null;

    if (stravaAthleteId) {
      const fullName = `${athleteCookie?.firstname ?? ""} ${athleteCookie?.lastname ?? ""}`.trim() || `Atleta Strava ${stravaAthleteId}`;
      const { data: athleteRow, error: athleteError } = await supabase
        .from("athletes")
        .upsert(
          { strava_athlete_id: stravaAthleteId, full_name: fullName },
          { onConflict: "strava_athlete_id" },
        )
        .select("id")
        .single();
      if (athleteError) throw athleteError;

      const { data: activityRow, error: activityError } = await supabase
        .from("activities")
        .upsert(
          {
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
          },
          { onConflict: "source,source_activity_id" },
        )
        .select("id")
        .single();
      if (activityError) throw activityError;
      databaseActivityId = activityRow.id;

      const status = report.status === "manual_review" ? "review" : report.status;
      const maxDeviation = report.checkpoint_results.reduce(
        (maximum, checkpoint) => Math.max(maximum, checkpoint.nearest_distance_m),
        0,
      );
      const { error: validationError } = await supabase
        .from("validation_results")
        .upsert(
          {
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
          },
          { onConflict: "activity_id" },
        );
      if (validationError) throw validationError;
      saved = true;
    }

    const response = NextResponse.json({
      report,
      route: {
        id: route.id,
        version: route.version,
        file_name: route.file_name,
        distance_km: route.distance_km,
        elevation_m: route.elevation_m,
      },
      activity: {
        id: String(activity.id),
        database_id: databaseActivityId,
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
      saved,
    });
    applyRefreshedCookies(response, refreshed);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao validar a atividade do Strava.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
