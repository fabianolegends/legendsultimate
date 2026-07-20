import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeRegistrationCode, normalizeRegistrationEmail, registrationPaymentAllowsAccess } from "@/lib/registration-access";

type RegistrationRow = {
  id: string;
  event_id: string;
  athlete_id: string | null;
  registration_code: string;
  bib_number: string | null;
  full_name: string;
  email: string;
  birth_date: string | null;
  gender: string | null;
  category: string | null;
  modality: string | null;
  country_code: string | null;
  city: string | null;
  status: string;
  claimed_at: string | null;
  source: string;
  external_registration_id: string | null;
  payment_status: string;
  last_synced_at: string | null;
};

function readAthlete(request: NextRequest) {
  const raw = request.cookies.get("strava_athlete")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id?: number; firstname?: string; lastname?: string; profile?: string };
  } catch {
    return null;
  }
}

function paymentStatusText(value: unknown) {
  if (value === "pending") return "com pagamento pendente";
  if (value === "refunded") return "com pagamento reembolsado";
  if (value === "cancelled") return "com pagamento cancelado";
  return "sem confirmação de pagamento";
}

export async function POST(request: NextRequest) {
  try {
    const athleteCookie = readAthlete(request);
    if (!athleteCookie?.id) return NextResponse.json({ error: "Conecte sua conta Strava novamente." }, { status: 401 });

    const body = await request.json() as { code?: string; email?: string };
    const code = normalizeRegistrationCode(String(body.code ?? ""));
    const email = normalizeRegistrationEmail(String(body.email ?? ""));
    if (!code) return NextResponse.json({ error: "Informe o código de vínculo da inscrição." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    let query = supabase
      .from("registrations")
      .select("id, event_id, athlete_id, registration_code, bib_number, full_name, email, birth_date, gender, category, modality, country_code, city, status, claimed_at, source, external_registration_id, payment_status, last_synced_at")
      .eq("registration_code", code);
    if (email) query = query.eq("email", email);

    const registrationResult = await query.maybeSingle();
    if (registrationResult.error) {
      if (registrationResult.error.code === "42P01") {
        return NextResponse.json({ error: "O módulo de inscritos ainda não foi ativado no Supabase." }, { status: 503 });
      }
      throw registrationResult.error;
    }

    const registration = (registrationResult.data ?? null) as RegistrationRow | null;
    if (!registration) return NextResponse.json({ error: "Inscrição não encontrada. Confira o código e o e-mail." }, { status: 404 });
    if (registration.status !== "confirmed") {
      const label = registration.status === "pending" ? "pendente" : registration.status === "waitlist" ? "em lista de espera" : "cancelada";
      return NextResponse.json({ error: `Esta inscrição está ${label} na Windfit e ainda não libera o Passport.` }, { status: 403 });
    }
    if (!registrationPaymentAllowsAccess(registration.payment_status)) {
      return NextResponse.json({ error: `Esta inscrição está ${paymentStatusText(registration.payment_status)} na Windfit. O Passport será liberado após a confirmação.` }, { status: 403 });
    }

    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .upsert({
        strava_athlete_id: athleteCookie.id,
        full_name: registration.full_name,
        email: registration.email,
        category: registration.category,
        country_code: registration.country_code,
        bib_number: registration.bib_number,
        birth_date: registration.birth_date,
        gender: registration.gender,
        modality: registration.modality,
        updated_at: new Date().toISOString(),
      }, { onConflict: "strava_athlete_id" })
      .select("id, strava_athlete_id, full_name")
      .single();
    if (athleteError) throw athleteError;

    if (registration.athlete_id && registration.athlete_id !== athlete.id) {
      return NextResponse.json({ error: "Esta inscrição já está vinculada a outra conta Strava. Fale com a organização." }, { status: 409 });
    }

    const { data: linked, error: linkError } = await supabase
      .from("registrations")
      .update({ athlete_id: athlete.id, claimed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", registration.id)
      .select("id, event_id, registration_code, bib_number, full_name, email, category, modality, country_code, city, status, claimed_at, source, payment_status")
      .single();
    if (linkError) throw linkError;

    return NextResponse.json({ linked: true, registration: linked });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao vincular a inscrição Windfit." }, { status: 500 });
  }
}
