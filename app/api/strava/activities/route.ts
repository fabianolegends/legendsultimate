import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
};

type StravaActivity = {
  id: number;
  name: string;
  sport_type?: string;
  type?: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  total_elevation_gain: number;
  moving_time: number;
  elapsed_time: number;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  calories?: number;
  trainer?: boolean;
  commute?: boolean;
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

export async function GET(request: NextRequest) {
  const clientId = process.env.STRAVA_CLIENT_ID?.trim();
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim();
  const requestedDate = request.nextUrl.searchParams.get("date")?.trim() || null;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ configured: false, connected: false, athlete: null, activities: [], date: requestedDate });
  }

  const { accessToken, refreshed } = await resolveAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ configured: true, connected: false, athlete: null, activities: [], date: requestedDate });
  }

  let after: number;
  let before: number | null = null;
  if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    const start = new Date(`${requestedDate}T00:00:00-03:00`);
    const end = new Date(`${requestedDate}T23:59:59-03:00`);
    after = Math.floor(start.getTime() / 1000) - 6 * 60 * 60;
    before = Math.floor(end.getTime() / 1000) + 6 * 60 * 60;
  } else {
    after = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  }

  const params = new URLSearchParams({ after: String(after), per_page: "50" });
  if (before) params.set("before", String(before));

  const activitiesResponse = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );

  if (!activitiesResponse.ok) {
    const response = NextResponse.json(
      {
        configured: true,
        connected: false,
        athlete: null,
        activities: [],
        date: requestedDate,
        error: "Falha ao consultar atividades do Strava.",
      },
      { status: activitiesResponse.status },
    );
    applyRefreshedCookies(response, refreshed);
    return response;
  }

  const raw = (await activitiesResponse.json()) as StravaActivity[];
  const cyclingTypes = new Set(["Ride", "MountainBikeRide", "GravelRide", "EBikeRide", "VirtualRide"]);
  const activities = raw
    .filter((activity) => cyclingTypes.has(activity.sport_type || activity.type || ""))
    .filter((activity) => !requestedDate || activity.start_date_local.slice(0, 10) === requestedDate)
    .map((activity) => ({
      id: String(activity.id),
      name: activity.name,
      sportType: activity.sport_type || activity.type || "Ride",
      startDate: activity.start_date,
      startDateLocal: activity.start_date_local,
      distanceKm: activity.distance / 1000,
      elevationM: activity.total_elevation_gain,
      movingTimeMin: activity.moving_time / 60,
      elapsedTimeMin: activity.elapsed_time / 60,
      avgSpeed: activity.average_speed ? activity.average_speed * 3.6 : 0,
      maxSpeed: activity.max_speed ? activity.max_speed * 3.6 : 0,
      avgHeartRate: activity.average_heartrate ?? null,
      maxHeartRate: activity.max_heartrate ?? null,
      avgWatts: activity.average_watts ?? null,
      weightedWatts: activity.weighted_average_watts ?? null,
      calories: activity.calories ?? null,
      trainer: Boolean(activity.trainer),
      commute: Boolean(activity.commute),
    }));

  let athlete: unknown = null;
  const athleteCookie = request.cookies.get("strava_athlete")?.value;
  if (athleteCookie) {
    try {
      athlete = JSON.parse(athleteCookie) as unknown;
    } catch {
      athlete = null;
    }
  }

  const response = NextResponse.json({ configured: true, connected: true, athlete, activities, date: requestedDate });
  applyRefreshedCookies(response, refreshed);
  return response;
}
