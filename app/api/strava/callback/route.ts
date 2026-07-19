import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete?: {
    id?: number;
    firstname?: string;
    lastname?: string;
    profile?: string;
  };
};

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin;
  const redirect = (status: string) => NextResponse.redirect(new URL(`/passport?strava=${status}`, siteUrl));

  const error = request.nextUrl.searchParams.get("error");
  if (error) return redirect("denied");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("strava_oauth_state")?.value;
  if (!code || !state || !storedState || state !== storedState) return redirect("invalid_state");

  const clientId = process.env.STRAVA_CLIENT_ID?.trim();
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return redirect("config");

  const tokenResponse = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) return redirect("token_error");
  const token = (await tokenResponse.json()) as StravaTokenResponse;
  if (!token.access_token || !token.refresh_token) return redirect("token_error");

  const response = redirect("connected");
  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set("strava_access_token", token.access_token, {
    ...cookieBase,
    maxAge: Math.max(60, token.expires_in || 21600),
  });
  response.cookies.set("strava_refresh_token", token.refresh_token, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 365,
  });
  response.cookies.set("strava_expires_at", String(token.expires_at || 0), {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 365,
  });
  response.cookies.set(
    "strava_athlete",
    JSON.stringify({
      id: token.athlete?.id,
      firstname: token.athlete?.firstname,
      lastname: token.athlete?.lastname,
      profile: token.athlete?.profile,
    }),
    { ...cookieBase, maxAge: 60 * 60 * 24 * 365 },
  );
  response.cookies.delete("strava_oauth_state");
  return response;
}
