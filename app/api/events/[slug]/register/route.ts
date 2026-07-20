import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeRegistrationEmail } from "@/lib/registration-access";
import { readRideWithGpsUser } from "@/lib/ridewithgps";
import { categoryForRegistration } from "@/lib/category-rules";

export const runtime = "nodejs";

function clean(value: unknown) { return String(value ?? "").trim(); }
function code() { return `LEG-${randomBytes(4).toString("hex").toUpperCase()}`; }
function validEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json() as Record<string, unknown>;
    if (clean(body.website)) return NextResponse.json({ registered: true });
    const fullName = clean(body.full_name);
    const email = normalizeRegistrationEmail(clean(body.email));
    const phone = clean(body.phone);
    const birthDate = clean(body.birth_date);
    const gender = clean(body.gender);
    const modality = body.modality === "experience" ? "experience" : "gravel_race";
    const city = clean(body.city);
    const state = clean(body.state);
    const country = clean(body.country) || "Brasil";
    if (fullName.length < 3 || !validEmail(email) || phone.replace(/\D/g, "").length < 8 || !birthDate || !city) {
      return NextResponse.json({ error: "Preencha corretamente nome, e-mail, WhatsApp, nascimento e cidade." }, { status: 400 });
    }
    if (body.terms_accepted !== true || body.privacy_accepted !== true) return NextResponse.json({ error: "É necessário aceitar o regulamento e o tratamento dos dados." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: event, error: eventError } = await supabase.from("events")
      .select("id, name, starts_on, status, access_mode, registration_open, registration_closes_at, registration_source, participant_limit, windfit_registration_url")
      .eq("slug", slug).eq("status", "published").maybeSingle();
    if (eventError?.code === "42703") return NextResponse.json({ error: "Execute a migration 013_public_event_registration.sql." }, { status: 503 });
    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    if (!event.registration_open || event.access_mode !== "public") return NextResponse.json({ error: "As inscrições deste evento não estão abertas ao público." }, { status: 403 });
    if (event.registration_closes_at && new Date(event.registration_closes_at).getTime() < Date.now()) return NextResponse.json({ error: "O período de inscrições foi encerrado." }, { status: 409 });
    if (event.registration_source === "windfit") return NextResponse.json({ error: "Esta inscrição deve ser concluída pela Windfit.", redirect_url: event.windfit_registration_url }, { status: 409 });

    const { data: existing, error: existingError } = await supabase.from("registrations").select("id, registration_code, status, payment_status").eq("event_id", event.id).eq("email", email).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return NextResponse.json({ error: "Este e-mail já está inscrito no evento.", already_registered: true }, { status: 409 });
    if (event.participant_limit != null) {
      const { count, error: countError } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id).neq("status", "cancelled");
      if (countError) throw countError;
      if ((count ?? 0) >= event.participant_limit) return NextResponse.json({ error: "As vagas deste evento estão esgotadas." }, { status: 409 });
    }

    const categoryRule = categoryForRegistration({ birthDate, eventDate: event.starts_on, gender, modality });
    if (categoryRule.error || !categoryRule.category) return NextResponse.json({ error: categoryRule.error ?? "Não foi possível definir sua categoria." }, { status: 400 });
    const category = categoryRule.category;
    const now = new Date().toISOString();
    const rideWithGpsUser = readRideWithGpsUser(request);
    let linkedAthleteId: string | null = null;
    if (rideWithGpsUser?.id) {
      const { data: linkedAthlete, error: linkedAthleteError } = await supabase.from("athletes")
        .select("id").eq("ride_with_gps_user_id", rideWithGpsUser.id).maybeSingle();
      if (linkedAthleteError) throw linkedAthleteError;
      linkedAthleteId = linkedAthlete?.id ?? null;
    }
    const { data: registration, error } = await supabase.from("registrations").insert({
      event_id: event.id, registration_code: code(), full_name: fullName, email, phone, birth_date: birthDate,
      gender: ["male", "female", "other"].includes(gender) ? gender : "other", category, modality,
      country_code: country.toLowerCase().includes("brasil") ? "BR" : null, city,
      location: [city, state, country].filter(Boolean).join(" / "), status: "confirmed", source: "online",
      payment_status: "courtesy", registered_at: now, terms_accepted_at: now, privacy_accepted_at: now,
      athlete_id: linkedAthleteId, claimed_at: linkedAthleteId ? now : null, updated_at: now,
    }).select("id, registration_code, full_name, email, category, modality, status").single();
    if (error?.code === "23505") return NextResponse.json({ error: "Este e-mail já está inscrito no evento." }, { status: 409 });
    if (error?.code === "P0001") return NextResponse.json({ error: error.message }, { status: 409 });
    if (error?.code === "23514" || error?.code === "42703") return NextResponse.json({ error: "Execute a migration 013_public_event_registration.sql." }, { status: 503 });
    if (error) throw error;
    return NextResponse.json({ registered: true, linked: Boolean(linkedAthleteId), event: { name: event.name }, registration }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível concluir a inscrição." }, { status: 500 });
  }
}
