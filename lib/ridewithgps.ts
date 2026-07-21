import { NextRequest, NextResponse } from "next/server";

export type RideWithGpsUser = {
  id?: number;
  name?: string;
  email?: string;
};

export const rideWithGpsCookieNames = [
  "rwgps_access_token",
  "rwgps_user",
  "rwgps_oauth_started",
] as const;

const legacyActivityCookieNames = [
  "strava_access_token",
  "strava_refresh_token",
  "strava_expires_at",
  "strava_athlete",
  "strava_oauth_state",
] as const;

const sessionCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function rideWithGpsConfiguration() {
  return {
    clientId: process.env.RIDE_WITH_GPS_CLIENT_ID?.trim() || "",
    clientSecret: process.env.RIDE_WITH_GPS_CLIENT_SECRET?.trim() || "",
  };
}

export function siteUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin;
}

export function readRideWithGpsUser(request: NextRequest): RideWithGpsUser | null {
  const raw = request.cookies.get("rwgps_user")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RideWithGpsUser;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw)) as RideWithGpsUser;
    } catch {
      return null;
    }
  }
}

export function readRideWithGpsAccessToken(request: NextRequest) {
  const raw = request.cookies.get("rwgps_access_token")?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function setRideWithGpsSession(response: NextResponse, input: { accessToken: string; user: RideWithGpsUser }) {
  response.cookies.set("rwgps_access_token", input.accessToken, {
    ...sessionCookie,
    maxAge: 60 * 60 * 24 * 180,
  });
  response.cookies.set("rwgps_user", JSON.stringify(input.user), {
    ...sessionCookie,
    maxAge: 60 * 60 * 24 * 180,
  });
}

export function clearRideWithGpsSession(response: NextResponse) {
  for (const name of rideWithGpsCookieNames) {
    response.cookies.set(name, "", { ...sessionCookie, maxAge: 0 });
  }
}

export function clearLegacyActivitySession(response: NextResponse) {
  for (const name of legacyActivityCookieNames) {
    response.cookies.set(name, "", { ...sessionCookie, maxAge: 0 });
  }
}

export async function getRideWithGpsUser(accessToken: string): Promise<RideWithGpsUser | null> {
  const response = await fetch("https://ridewithgps.com/api/v1/users/current.json", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { user?: RideWithGpsUser };
  return payload.user ?? null;
}

export function localDateInSaoPaulo(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
