import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeRegistrationCode, normalizeRegistrationEmail } from "@/lib/registration-access";

const questionKeys = [
  "cardiovascular",
  "chest_pain",
  "syncope_palpitations",
  "hypertension",
  "respiratory",
  "metabolic",
  "neurological",
  "orthopedic",
  "severe_allergy",
  "continuous_medication",
  "recent_surgery",
  "other_condition",
] as const;

function clean(value: unknown, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

function athleteNumberCandidates(value: string) {
  const raw = clean(value, 120);
  const normalized = normalizeRegistrationCode(raw);
  return [...new Set([raw, normalized].filter(Boolean))];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const athleteNumber = clean(body.athlete_number, 120);
    const email = normalizeRegistrationEmail(clean(body.email, 240));
    if (!athleteNumber || !email) {
      return NextResponse.json({ error: "Informe o número do atleta e o e-mail usado na inscrição." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const candidates = athleteNumberCandidates(athleteNumber);
    let registration: any = null;

    for (const candidate of candidates) {
      const query = await supabase
        .from("registrations")
        .select("id,event_id,registration_code,external_registration_id,bib_number,full_name,email,birth_date,status,payment_status")
        .eq("email", email)
        .or(`registration_code.eq.${candidate},external_registration_id.eq.${candidate},bib_number.eq.${candidate}`)
        .limit(1)
        .maybeSingle();
      if (query.error && query.error.code !== "PGRST116") throw query.error;
      if (query.data) { registration = query.data; break; }
    }

    if (!registration) {
      return NextResponse.json({ error: "Não encontramos uma inscrição com esse número e e-mail. Confira os dados recebidos na confirmação da inscrição." }, { status: 404 });
    }
    if (registration.status === "cancelled" || ["cancelled", "refunded"].includes(registration.payment_status)) {
      return NextResponse.json({ error: "Esta inscrição não está ativa." }, { status: 409 });
    }

    const emergencyName = clean(body.emergency_contact_name, 180);
    const emergencyPhone = clean(body.emergency_contact_phone, 80);
    const bloodType = clean(body.blood_type, 10);
    if (!emergencyName || !emergencyPhone) {
      return NextResponse.json({ error: "Informe o contato e o telefone de emergência." }, { status: 400 });
    }
    if (body.consent !== true) {
      return NextResponse.json({ error: "É necessário aceitar a declaração e o tratamento restrito dos dados de saúde." }, { status: 400 });
    }

    const answers: Record<string, boolean> = {};
    for (const key of questionKeys) answers[key] = body[key] === true;
    const now = new Date().toISOString();
    const resolvedNumber = registration.external_registration_id || registration.registration_code || registration.bib_number || athleteNumber;

    const { error } = await supabase.from("health_declarations").upsert({
      event_id: registration.event_id,
      registration_id: registration.id,
      athlete_number: resolvedNumber,
      full_name: registration.full_name,
      email: registration.email,
      birth_date: registration.birth_date,
      blood_type: bloodType || null,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      answers,
      medications: clean(body.medications, 3000) || null,
      allergies: clean(body.allergies, 3000) || null,
      health_notes: clean(body.health_notes, 5000) || null,
      consent_accepted_at: now,
      submitted_at: now,
      updated_at: now,
    }, { onConflict: "event_id,registration_id" });

    if (error?.code === "42P01") {
      return NextResponse.json({ error: "Módulo de saúde ainda não ativado. Execute a migration 026_health_declarations.sql." }, { status: 409 });
    }
    if (error) throw error;

    return NextResponse.json({ ok: true, athlete_name: registration.full_name, athlete_number: resolvedNumber });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível enviar a declaração de saúde." }, { status: 500 });
  }
}
