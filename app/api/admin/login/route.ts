import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  isAdminPasswordConfigured,
  verifyAdminPassword,
  verifyAdminPasswordHash,
} from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  let session;
  if (email) {
    const supabase = createSupabaseAdmin();
    const { data: user, error } = await supabase.from("admin_users")
      .select("id, email, full_name, role, password_hash, active")
      .eq("email", email).maybeSingle();
    if (error?.code === "42P01") return NextResponse.json({ error: "Execute a migration 019_access_audit_backups.sql no Supabase." }, { status: 409 });
    if (error || !user || !user.active || !verifyAdminPasswordHash(password, user.password_hash)) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }
    session = createAdminSession({ userId: user.id, email: user.email, name: user.full_name, role: user.role, legacy: false });
    await supabase.from("admin_users").update({ last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", user.id);
  } else {
    if (!isAdminPasswordConfigured()) return NextResponse.json({ error: "Informe o e-mail do usuário ou configure o acesso de contingência." }, { status: 503 });
    if (!verifyAdminPassword(password)) return NextResponse.json({ error: "Senha administrativa inválida." }, { status: 401 });
    session = createAdminSession();
  }
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
