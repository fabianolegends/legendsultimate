import { NextRequest, NextResponse } from "next/server";
import { getRideWithGpsUser, rideWithGpsConfiguration, setRideWithGpsSession, siteUrl } from "@/lib/ridewithgps";

export const runtime = "nodejs";

type TokenResponse = { access_token?: string; user_id?: number };

export async function GET(request: NextRequest) {
  const origin = siteUrl(request);
  const redirect = (status: string, path = "/passport/acesso") =>
    NextResponse.redirect(new URL(`${path}?ride=${status}`, origin));

  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const state = request.nextUrl.searchParams.get("state");
  const started = request.cookies.get("rwgps_oauth_started")?.value;
  if (error) return redirect("denied");
  if (!code || !started || state !== started) return redirect("invalid_request");

  const { clientId, clientSecret } = rideWithGpsConfiguration();
  if (!clientId || !clientSecret) return redirect("config");

  const redirectUri = `${origin}/api/ridewithgps/callback`;
  const tokenResponse = await fetch("https://ridewithgps.com/oauth/token.json", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) return redirect("token_error");

  const token = (await tokenResponse.json()) as TokenResponse;
  if (!token.access_token) return redirect("token_error");
  const user = await getRideWithGpsUser(token.access_token);
  if (!user?.id && !token.user_id) return redirect("user_error");

  const response = redirect("connected", "/passport/atleta");
  setRideWithGpsSession(response, {
    accessToken: token.access_token,
    user: { id: user?.id ?? token.user_id, name: user?.name, email: user?.email },
  });
  response.cookies.set("rwgps_oauth_started", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
