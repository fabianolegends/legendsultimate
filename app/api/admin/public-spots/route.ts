import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { recordAdminAudit } from "@/lib/admin-audit";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const eventId = request.nextUrl.searchParams.get("eventId")?.trim();
  if (!eventId) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("events")
    .select("id, name, participant_limit, public_remaining_spots")
    .eq("id", eventId)
    .single();

  if (error?.code === "42703") {
    return NextResponse.json({ error: "Execute a migration 025_public_remaining_spots.sql no Supabase." }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ event: data });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventId = String(body.event_id ?? "").trim();
    const remaining = Number(body.public_remaining_spots);
    if (!eventId) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    if (!Number.isInteger(remaining) || remaining < 0) {
      return NextResponse.json({ error: "Informe uma quantidade válida de vagas restantes." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const current = await supabase
      .from("events")
      .select("id, name, participant_limit, public_remaining_spots")
      .eq("id", eventId)
      .single();

    if (current.error?.code === "42703") {
      return NextResponse.json({ error: "Execute a migration 025_public_remaining_spots.sql no Supabase." }, { status: 409 });
    }
    if (current.error || !current.data) throw current.error ?? new Error("Evento não encontrado.");

    const total = Number(current.data.participant_limit ?? 100);
    if (Number.isFinite(total) && total > 0 && remaining > total) {
      return NextResponse.json({ error: `As vagas restantes não podem superar o limite de ${total}.` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("events")
      .update({ public_remaining_spots: remaining, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select("id, name, participant_limit, public_remaining_spots")
      .single();
    if (error) throw error;

    await recordAdminAudit(request, {
      action: "event.public_spots.updated",
      resourceType: "event",
      resourceId: eventId,
      eventId,
      details: { from: current.data.public_remaining_spots, to: remaining, participant_limit: total },
    });

    return NextResponse.json({ event: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o contador." }, { status: 500 });
  }
}
