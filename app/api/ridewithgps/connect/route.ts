import { NextRequest, NextResponse } from "next/server";
import { siteUrl } from "@/lib/ridewithgps";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = siteUrl(request);
  return NextResponse.redirect(new URL("/passport/acesso?status=preparing", origin));
}
