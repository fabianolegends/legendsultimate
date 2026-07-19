import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { error: "A senha administrativa ainda não foi configurada na Vercel." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (!verifyAdminPassword(String(body.password ?? ""))) {
    return NextResponse.json({ error: "Senha administrativa inválida." }, { status: 401 });
  }

  const session = createAdminSession();
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ADMIN_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return response;
}
