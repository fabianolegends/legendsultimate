import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_STATUS = new Set(["new", "contacted", "archived"]);

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request, "registrations.manage"))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("priority_list_leads")
      .select("id,full_name,email,city,phone,expectations,status,source,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Execute a migration 020_priority_list_leads.sql no Supabase." },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ leads: data ?? [] });
  } catch (error) {
    console.error("admin.priority-list.get", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a lista prioritária." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request, "registrations.manage"))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!body.id || !body.status || !ALLOWED_STATUS.has(body.status)) {
    return NextResponse.json({ error: "Atualização inválida." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("priority_list_leads")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select("id,status")
      .single();

    if (error) throw error;
    return NextResponse.json({ lead: data });
  } catch (error) {
    console.error("admin.priority-list.patch", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o contato." },
      { status: 500 },
    );
  }
}
