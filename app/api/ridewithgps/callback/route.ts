import { NextRequest, NextResponse } from "next/server";
import { getRideWithGpsUser, rideWithGpsConfiguration, setRideWithGpsSession, siteUrl } from "@/lib/ridewithgps";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { encryptActivityToken } from "@/lib/ridewithgps-token-vault";

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

  const rideWithGpsUserId = user?.id ?? token.user_id;
  try {
    const supabase = createSupabaseAdmin();
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .upsert({
        ride_with_gps_user_id: rideWithGpsUserId,
        full_name: user?.name?.trim() || `Atleta Ride with GPS ${rideWithGpsUserId}`,
        email: user?.email ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "ride_with_gps_user_id" })
      .select("id")
      .single();
    if (athleteError || !athlete) throw athleteError ?? new Error("Atleta não encontrado.");
    const encrypted = encryptActivityToken(token.access_token);
    const { error: connectionError } = await supabase.from("ride_with_gps_connections").upsert({
      athlete_id: athlete.id,
      ride_with_gps_user_id: rideWithGpsUserId,
      access_token_ciphertext: encrypted.ciphertext,
      access_token_iv: encrypted.iv,
      access_token_tag: encrypted.tag,
      status: "active",
      last_error: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "athlete_id" });
    if (connectionError && !["42P01", "42703"].includes(connectionError.code ?? "")) throw connectionError;
  } catch (connectionError) {
    console.error("Ride with GPS persistent connection was not saved.", connectionError);
  }

  const response = redirect("connected", "/passport/atleta");
  setRideWithGpsSession(response, {
    accessToken: token.access_token,
    user: { id: rideWithGpsUserId, name: user?.name, email: user?.email },
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
