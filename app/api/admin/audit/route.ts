import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request, "audit.view")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const url = new URL(request.url);
  const eventId = url.searchParams.get("event_id");
  let query = createSupabaseAdmin().from("admin_operation_audit").select("id, actor_email, actor_role, action, resource_type, resource_id, event_id, details, created_at").order("created_at", { ascending: false }).limit(300);
  if (eventId) query = query.eq("event_id", eventId);
  const { data, error } = await query;
  if (error?.code === "42P01") return NextResponse.json({ error: "Execute a migration 019_access_audit_backups.sql no Supabase." }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ audit: data ?? [] });
}
