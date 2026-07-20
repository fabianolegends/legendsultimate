import { NextRequest, NextResponse } from "next/server";
import { clearRideWithGpsSession, readRideWithGpsAccessToken, rideWithGpsConfiguration } from "@/lib/ridewithgps";

export async function POST(request: NextRequest) {
  const accessToken = readRideWithGpsAccessToken(request);
  const { clientId, clientSecret } = rideWithGpsConfiguration();

  if (accessToken && clientId && clientSecret) {
    const revoke = await fetch("https://ridewithgps.com/oauth/revoke.json", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, token: accessToken }),
      cache: "no-store",
    });
    if (!revoke.ok) {
      return NextResponse.json({ error: "Não foi possível desconectar sua conta Ride with GPS agora. Tente novamente." }, { status: 502 });
    }
  }

  const response = NextResponse.json({ ok: true });
  clearRideWithGpsSession(response);
  return response;
}
