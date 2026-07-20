import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { recordAdminAudit } from "@/lib/admin-audit";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function rpcError(error: { code?: string; message?: string }) {
  if (error.code === "42883" || error.code === "PGRST202") {
    return NextResponse.json({ error: "Execute a migration 017_safe_test_data_cleanup.sql no Supabase." }, { status: 409 });
  }
  const status = error.code === "P0002" ? 404 : error.code === "P0001" || error.code === "22023" ? 409 : 500;
  return NextResponse.json({ error: error.message ?? "Não foi possível preparar a limpeza." }, { status });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  const eventId = request.nextUrl.searchParams.get("eventId")?.trim();
  if (!eventId) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.rpc("preview_test_event_cleanup", { p_event_id: eventId });
  if (error) return rpcError(error);
  return NextResponse.json({ preview: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventId = String(body.event_id ?? "").trim();
    const confirmation = String(body.confirmation ?? "");
    if (!eventId || !confirmation) {
      return NextResponse.json({ error: "Evento e confirmação são obrigatórios." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.rpc("cleanup_test_event_data", {
      p_event_id: eventId,
      p_confirmation: confirmation,
      p_actor_reference: "organization-passport",
    });
    if (error) return rpcError(error);
    await recordAdminAudit(request, { action: "test_event.cleaned", resourceType: "event", resourceId: eventId, eventId, details: { result: data } });
    return NextResponse.json({ result: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível limpar o evento." }, { status: 500 });
  }
}
