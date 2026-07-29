import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  activeRegistrationLot,
  nextRegistrationLot,
  type RegistrationLot,
} from "@/lib/registration-pricing";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = createSupabaseAdmin();
    const { data: event, error } = await supabase.from("events")
      .select("id, slug, name, description, location, starts_on, ends_on, event_type, scoring_mode, registration_source, access_mode, participant_limit, registration_open, registration_closes_at, windfit_registration_url, terms_url, registration_fee_cents, experience_fee_cents, asaas_max_installments, premium_kit_enabled, premium_kit_fee_cents, casual_shirt_required, senior_discount_enabled, senior_discount_percent, regulation_version, is_test, status")
      .eq("slug", slug).eq("status", "published").maybeSingle();
    if (error?.code === "42703") return NextResponse.json({ error: "A inscrição online ainda não foi ativada." }, { status: 503 });
    if (error) throw error;
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const [{ data: stages, error: stageError }, { count, error: countError }, lotResult] = await Promise.all([
      supabase.from("stages").select("id, stage_number, name, route_label, stage_date, distance_km, elevation_m").eq("event_id", event.id).order("stage_number"),
      supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id).neq("status", "cancelled"),
      supabase.from("registration_lots").select("id, event_id, name, starts_at, ends_at, registration_fee_cents, display_order").eq("event_id", event.id).order("display_order"),
    ]);
    if (stageError) throw stageError;
    if (countError) throw countError;
    if (lotResult.error) throw lotResult.error;
    const lots = (lotResult.data ?? []) as RegistrationLot[];
    const currentLot = activeRegistrationLot(lots);
    const nextLot = nextRegistrationLot(lots);
    const registered = count ?? 0;
    const remaining = event.participant_limit == null ? null : Math.max(0, event.participant_limit - registered);
    const closedByDate = Boolean(event.registration_closes_at && new Date(event.registration_closes_at).getTime() < Date.now());
    const awaitingLot = lots.length > 0 && !currentLot && Boolean(nextLot);
    const lotsEnded = lots.length > 0 && !currentLot && !nextLot;
    const available = event.registration_open && event.access_mode === "public" && !closedByDate && !awaitingLot && !lotsEnded && (remaining == null || remaining > 0);
    return NextResponse.json({
      event,
      stages: stages ?? [],
      pricing: {
        lots,
        current_lot: currentLot,
        next_lot: nextLot,
      },
      availability: {
        registered,
        remaining,
        available,
        closed_by_date: closedByDate,
        full: remaining === 0,
        awaiting_lot: awaitingLot,
        lots_ended: lotsEnded,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar o evento." }, { status: 500 });
  }
}
