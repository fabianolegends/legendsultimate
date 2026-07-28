import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeRegistrationCode, normalizeRegistrationEmail } from "@/lib/registration-access";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const email = normalizeRegistrationEmail(request.nextUrl.searchParams.get("email") ?? "");
    const registrationCode = normalizeRegistrationCode(request.nextUrl.searchParams.get("code") ?? "");
    if (!email || !registrationCode) {
      return NextResponse.json({ error: "Informe o e-mail e o código da inscrição." }, { status: 400 });
    }
    const supabase = createSupabaseAdmin();
    const { data: event, error: eventError } = await supabase.from("events")
      .select("id, name, slug")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const { data, error } = await supabase.from("registrations")
      .select("registration_code, full_name, email, category, modality, status, payment_status, payment_checkout_url, payment_checkout_status, payment_expires_at, payment_confirmed_at")
      .eq("event_id", event.id)
      .eq("registration_code", registrationCode)
      .eq("email", email)
      .maybeSingle();
    if (error?.code === "42703") {
      return NextResponse.json({ error: "Execute a migration 022_asaas_checkout.sql." }, { status: 503 });
    }
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
    const checkoutStillActive = data.payment_status === "pending"
      && !["CANCELED", "EXPIRED", "PAID", "FAILED"].includes(data.payment_checkout_status ?? "")
      && (!data.payment_expires_at || new Date(data.payment_expires_at).getTime() > Date.now());
    return NextResponse.json({
      event: { name: event.name, slug: event.slug },
      registration: {
        ...data,
        payment_checkout_url: checkoutStillActive ? data.payment_checkout_url : null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível consultar a inscrição." }, { status: 500 });
  }
}
