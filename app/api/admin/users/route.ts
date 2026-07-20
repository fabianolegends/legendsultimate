import { NextRequest, NextResponse } from "next/server";
import { adminSessionFromRequest, hashAdminPassword, isAdminRequest, type AdminRole } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const roles = new Set<AdminRole>(["owner", "director", "steward", "viewer"]);
const unauthorized = () => NextResponse.json({ error: "Apenas o proprietário pode gerenciar usuários." }, { status: 403 });

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request, "users.manage")) return unauthorized();
  const { data, error } = await createSupabaseAdmin().from("admin_users")
    .select("id, email, full_name, role, active, last_login_at, created_at, updated_at")
    .order("full_name");
  if (error?.code === "42P01") return NextResponse.json({ error: "Execute a migration 019_access_audit_backups.sql no Supabase." }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [], session: adminSessionFromRequest(request) });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "users.manage")) return unauthorized();
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email ?? "").trim().toLowerCase();
  const fullName = String(body.full_name ?? "").trim();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "viewer") as AdminRole;
  if (!email || !fullName || password.length < 10 || !roles.has(role)) return NextResponse.json({ error: "Informe nome, e-mail, papel e uma senha de ao menos 10 caracteres." }, { status: 400 });
  const { data, error } = await createSupabaseAdmin().from("admin_users").insert({ email, full_name: fullName, role, password_hash: hashAdminPassword(password) }).select("id, email, full_name, role, active, created_at").single();
  if (error?.code === "23505") return NextResponse.json({ error: "Este e-mail já possui acesso." }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await recordAdminAudit(request, { action: "user.created", resourceType: "admin_user", resourceId: data.id, details: { email, role } });
  return NextResponse.json({ user: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "users.manage")) return unauthorized();
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const id = String(body.id ?? "");
  const role = body.role ? String(body.role) as AdminRole : undefined;
  const active = typeof body.active === "boolean" ? body.active : undefined;
  const password = String(body.password ?? "");
  if (!id || (role && !roles.has(role))) return NextResponse.json({ error: "Alteração inválida." }, { status: 400 });
  const supabase = createSupabaseAdmin();
  const { data: current } = await supabase.from("admin_users").select("id, email, role, active").eq("id", id).single();
  if (!current) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  if (current.role === "owner" && (active === false || (role && role !== "owner"))) {
    const { count } = await supabase.from("admin_users").select("id", { count: "exact", head: true }).eq("role", "owner").eq("active", true);
    if ((count ?? 0) <= 1) return NextResponse.json({ error: "Não é possível remover o último proprietário ativo." }, { status: 409 });
  }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (role) updates.role = role;
  if (active !== undefined) updates.active = active;
  if (password) {
    if (password.length < 10) return NextResponse.json({ error: "A nova senha deve ter ao menos 10 caracteres." }, { status: 400 });
    updates.password_hash = hashAdminPassword(password);
  }
  const { data, error } = await supabase.from("admin_users").update(updates).eq("id", id).select("id, email, full_name, role, active, last_login_at, updated_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await recordAdminAudit(request, { action: "user.updated", resourceType: "admin_user", resourceId: id, details: { role, active, password_changed: Boolean(password) } });
  return NextResponse.json({ user: data });
}
