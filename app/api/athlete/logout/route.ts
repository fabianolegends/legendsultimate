import { NextResponse } from "next/server";

const cookies = ["strava_access_token", "strava_refresh_token", "strava_expires_at", "strava_athlete", "strava_oauth_state"];

export async function POST() {
  const response = NextResponse.json({ connected: false });
  for (const name of cookies) {
    response.cookies.set(name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  }
  return response;
}
