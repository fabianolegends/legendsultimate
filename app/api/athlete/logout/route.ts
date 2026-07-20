import { NextResponse } from "next/server";
import { clearLegacyActivitySession, clearRideWithGpsSession } from "@/lib/ridewithgps";

export async function POST() {
  const response = NextResponse.json({ connected: false });
  clearRideWithGpsSession(response);
  clearLegacyActivitySession(response);
  return response;
}
