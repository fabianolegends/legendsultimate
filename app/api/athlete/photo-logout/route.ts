import { NextResponse } from "next/server";
import { clearAthletePhotoSessionCookie } from "@/lib/athlete-photo-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAthletePhotoSessionCookie(response);
  return response;
}
