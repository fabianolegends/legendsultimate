import { NextRequest, NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  return NextResponse.json({ session });
}
