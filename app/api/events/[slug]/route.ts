import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = createSupabaseAdmin();
    const { data: event, error } = await supabase.from("events")
      .select("id, slug, name, description, location, starts_on, ends_on, event_type, scoring_mode, registration_source, access_mode, participant_limit, registration_open, registration_closes_at, windfit_registration_url, terms_url, registration_fee_cents, experience_fee_cents, asaas_max_installments, is_test, status")
      .eq("slug", slug).eq("status", "published").maybeSingle();
    if (error?.code === "42703") return NextResponse.json({ error: "A inscrição online ainda não foi ativada." }, { status: 503 });
    if (error) throw error;
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const [{ data: stages, error: stageError }, { count, error: countError }] = await Promise.all([
      supabase.from("stages").select("id, stage_number, name, route_label, stage_date, distance_km, elevation_m").eq("event_id", event.id).order("stage_number"),
      supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id).neq("status", "cancelled"),
    ]);
    if (stageError) throw stageError;
    if (countError) throw countError;
    const registered = count ?? 0;
    const remaining = event.participant_limit == null ? null : Math.max(0, event.participant_limit - registered);
    const closedByDate = Boolean(event.registration_closes_at && new Date(event.registration_closes_at).getTime() < Date.now());
    const available = event.registration_open && event.access_mode === "public" && !closedByDate && (remaining == null || remaining > 0);
    return NextResponse.json({ event, stages: stages ?? [], availability: { registered, remaining, available, closed_by_date: closedByDate, full: remaining === 0 } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar o evento." }, { status: 500 });
  }
}
