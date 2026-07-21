import { NextRequest, NextResponse } from "next/server";
import { clearRideWithGpsSession, readRideWithGpsAccessToken, readRideWithGpsUser, rideWithGpsConfiguration } from "@/lib/ridewithgps";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const accessToken = readRideWithGpsAccessToken(request);
  const user = readRideWithGpsUser(request);
  const { clientId, clientSecret } = rideWithGpsConfiguration();
  let warning: string | null = null;

  if (accessToken && clientId && clientSecret) {
    const revoke = await fetch("https://ridewithgps.com/oauth/revoke.json", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, token: accessToken }),
      cache: "no-store",
    });
    if (!revoke.ok) {
      warning = "O acesso local foi removido, mas o Ride with GPS não confirmou a revogação. Revogue também o aplicativo nas configurações da sua conta.";
    }
  }

  if (user?.id) {
    try {
      const supabase = createSupabaseAdmin();
      const { error } = await supabase.from("ride_with_gps_connections").update({
        status: "revoked",
        last_error: warning,
        updated_at: new Date().toISOString(),
      }).eq("ride_with_gps_user_id", user.id);
      if (error && !["42P01", "42703"].includes(error.code ?? "")) throw error;
    } catch (error) {
      console.error("Ride with GPS persistent connection was not revoked.", error);
    }
  }

  const response = NextResponse.json({ ok: true, warning });
  clearRideWithGpsSession(response);
  return response;
}
