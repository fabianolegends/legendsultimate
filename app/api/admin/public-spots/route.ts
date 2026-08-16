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
    .select("id, name, participant_limit, public_remaining_spots, public_remaining_spots_ultimate, public_remaining_spots_short")
    .eq("id", eventId)
    .single();

  if (error?.code === "42703") {
    return NextResponse.json({ error: "Execute as migrations 025_public_remaining_spots.sql e 030_journey_formats.sql no Supabase." }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ event: data });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventId = String(body.event_id ?? "").trim();
    const journeyFormat = body.journey_format === "short" ? "short" : "ultimate";
    const remaining = Number(body.remaining);
    if (!eventId) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    if (!Number.isInteger(remaining) || remaining < 0) {
      return NextResponse.json({ error: "Informe uma quantidade válida de vagas restantes." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const current = await supabase
      .from("events")
      .select("id, name, participant_limit, public_remaining_spots, public_remaining_spots_ultimate, public_remaining_spots_short")
      .eq("id", eventId)
      .single();

    if (current.error?.code === "42703") {
      return NextResponse.json({ error: "Execute as migrations 025_public_remaining_spots.sql e 030_journey_formats.sql no Supabase." }, { status: 409 });
    }
    if (current.error || !current.data) throw current.error ?? new Error("Evento não encontrado.");

    const total = journeyFormat === "short" ? 50 : 100;
    if (remaining > total) {
      return NextResponse.json({ error: `As vagas restantes não podem superar o limite de ${total}.` }, { status: 400 });
    }

    const field = journeyFormat === "short" ? "public_remaining_spots_short" : "public_remaining_spots_ultimate";
    const previous = journeyFormat === "short"
      ? Number(current.data.public_remaining_spots_short ?? 50)
      : Number(current.data.public_remaining_spots_ultimate ?? 100);
    const ultimateRemaining = journeyFormat === "ultimate" ? remaining : Number(current.data.public_remaining_spots_ultimate ?? 100);
    const shortRemaining = journeyFormat === "short" ? remaining : Number(current.data.public_remaining_spots_short ?? 50);

    const { data, error } = await supabase
      .from("events")
      .update({ [field]: remaining, public_remaining_spots: ultimateRemaining + shortRemaining, participant_limit: 150, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select("id, name, participant_limit, public_remaining_spots, public_remaining_spots_ultimate, public_remaining_spots_short")
      .single();
    if (error) throw error;

    await recordAdminAudit(request, {
      action: "event.public_spots.updated",
      resourceType: "event",
      resourceId: eventId,
      eventId,
      details: { journey_format: journeyFormat, from: previous, to: remaining, participant_limit: total },
    });

    return NextResponse.json({ event: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o contador." }, { status: 500 });
  }
}
