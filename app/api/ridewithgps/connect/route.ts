import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { clearLegacyActivitySession, rideWithGpsConfiguration, siteUrl } from "@/lib/ridewithgps";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { clientId } = rideWithGpsConfiguration();
  const origin = siteUrl(request);
  if (!clientId) return NextResponse.redirect(new URL("/passport/acesso?ride=config", origin));

  const redirectUri = `${origin}/api/ridewithgps/callback`;
  const state = randomBytes(24).toString("hex");
  const authorizeUrl = new URL("https://ridewithgps.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  clearLegacyActivitySession(response);
  response.cookies.set("rwgps_oauth_started", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
