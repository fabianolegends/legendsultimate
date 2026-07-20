import { NextRequest, NextResponse } from "next/server";
import { clearLegacyActivitySession, getRideWithGpsUser, localDateInSaoPaulo, readRideWithGpsAccessToken, readRideWithGpsUser, rideWithGpsConfiguration } from "@/lib/ridewithgps";

export const runtime = "nodejs";

type RideWithGpsTrip = {
  id: number;
  name?: string;
  departed_at?: string | null;
  created_at?: string;
  activity_type?: string | null;
  stationary?: boolean;
  distance?: number;
  elevation_gain?: number;
  moving_time?: number;
  duration?: number;
  avg_speed?: number | null;
  max_speed?: number | null;
  avg_hr?: number | null;
  max_hr?: number | null;
  avg_watts?: number | null;
  calories?: number | null;
};

export async function GET(request: NextRequest) {
  const requestedDate = request.nextUrl.searchParams.get("date")?.trim() || null;
  const json = (body: Record<string, unknown>, init?: ResponseInit) => {
    const response = NextResponse.json(body, init);
    clearLegacyActivitySession(response);
    return response;
  };
  const { clientId, clientSecret } = rideWithGpsConfiguration();
  if (!clientId || !clientSecret) {
    return json({ configured: false, connected: false, athlete: null, activities: [], date: requestedDate });
  }

  const accessToken = readRideWithGpsAccessToken(request);
  if (!accessToken) {
    return json({ configured: true, connected: false, athlete: null, activities: [], date: requestedDate });
  }

  const response = await fetch("https://ridewithgps.com/api/v1/trips.json?page=1&page_size=200", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    return json({
      configured: true,
      connected: false,
      athlete: null,
      activities: [],
      date: requestedDate,
      error: "Falha ao consultar atividades no Ride with GPS.",
    }, { status: response.status });
  }

  const payload = (await response.json()) as { trips?: RideWithGpsTrip[] };
  const athlete = readRideWithGpsUser(request) ?? await getRideWithGpsUser(accessToken);
  const activities = (payload.trips ?? [])
    .filter((trip) => !trip.stationary)
    .filter((trip) => (trip.activity_type ?? "").toLowerCase().includes("cycling"))
    .filter((trip) => {
      if (!requestedDate) return true;
      const date = trip.departed_at ?? trip.created_at;
      return Boolean(date && localDateInSaoPaulo(date) === requestedDate);
    })
    .map((trip) => ({
      id: String(trip.id),
      name: trip.name || "Atividade Ride with GPS",
      sportType: trip.activity_type || "cycling",
      startDate: trip.departed_at ?? trip.created_at ?? new Date(0).toISOString(),
      startDateLocal: trip.departed_at ?? trip.created_at ?? new Date(0).toISOString(),
      distanceKm: Number(trip.distance ?? 0) / 1000,
      elevationM: Number(trip.elevation_gain ?? 0),
      movingTimeMin: Number(trip.moving_time ?? trip.duration ?? 0) / 60,
      elapsedTimeMin: Number(trip.duration ?? trip.moving_time ?? 0) / 60,
      avgSpeed: Number(trip.avg_speed ?? 0),
      maxSpeed: Number(trip.max_speed ?? 0),
      avgHeartRate: trip.avg_hr ?? null,
      maxHeartRate: trip.max_hr ?? null,
      avgWatts: trip.avg_watts ?? null,
      weightedWatts: null,
      calories: trip.calories ?? null,
      trainer: false,
      commute: false,
    }));

  return json({ configured: true, connected: true, athlete, activities, date: requestedDate });
}
