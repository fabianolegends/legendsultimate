import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";
import { normalizeRegistrationCode, normalizeRegistrationEmail } from "@/lib/registration-access";

export const runtime = "nodejs";

type RegistrationInput = {
  event_id?: string; registration_code?: string; bib_number?: string | null; full_name?: string; email?: string;
  birth_date?: string | null; gender?: string | null; category?: string | null; modality?: string;
  country_code?: string | null; city?: string | null; status?: string;
};

function unauthorized() { return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 }); }
function makeRegistrationCode() { return `LEG-${randomBytes(4).toString("hex").toUpperCase()}`; }
function cleanNullable(value: unknown) { const text = String(value ?? "").trim(); return text || null; }

function normalizeDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (!match) return text;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function normalizeGender(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!text) return null;
  if (["m", "masculino", "male", "homem"].includes(text)) return "male";
  if (["f", "feminino", "female", "mulher"].includes(text)) return "female";
  return "other";
}

function normalizeStatus(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["pending", "pendente"].includes(text)) return "pending";
  if (["waitlist", "lista_de_espera", "lista de espera", "espera"].includes(text)) return "waitlist";
  if (["cancelled", "canceled", "cancelada", "cancelado"].includes(text)) return "cancelled";
  return "confirmed";
}

function normalizeModality(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  return text.includes("experience") || text.includes("turismo") ? "experience" : "gravel_race";
}

function normalizeInput(input: RegistrationInput, forcedEventId?: string) {
  const eventId = String(forcedEventId ?? input.event_id ?? "").trim();
  const fullName = String(input.full_name ?? "").trim();
  const email = normalizeRegistrationEmail(String(input.email ?? ""));
  if (!eventId || !fullName || !email) throw new Error("Evento, nome completo e e-mail são obrigatórios.");
  return {
    event_id: eventId,
    registration_code: normalizeRegistrationCode(String(input.registration_code ?? "")) || makeRegistrationCode(),
    bib_number: cleanNullable(input.bib_number), full_name: fullName, email,
    birth_date: normalizeDate(input.birth_date), gender: normalizeGender(input.gender), category: cleanNullable(input.category),
    modality: normalizeModality(input.modality), country_code: cleanNullable(input.country_code)?.toUpperCase() ?? null,
    city: cleanNullable(input.city), status: normalizeStatus(input.status), updated_at: new Date().toISOString(),
  };
}

async function syncLinkedAthlete(supabase: any, registration: any) {
  if (!registration?.athlete_id) return;
  const { error } = await supabase.from("athletes").update({
    full_name: registration.full_name, email: registration.email, category: registration.category,
    country_code: registration.country_code, bib_number: registration.bib_number, birth_date: registration.birth_date,
    gender: registration.gender, modality: registration.modality, updated_at: new Date().toISOString(),
  }).eq("id", registration.athlete_id);
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const supabase = createSupabaseAdmin();
    const { data: events, error: eventError } = await supabase.from("events").select("id, slug, name, status, starts_on, ends_on").order("starts_on", { ascending: false });
    if (eventError) throw eventError;
    const eventId = request.nextUrl.searchParams.get("eventId")?.trim();
    let query = supabase.from("registrations").select("id, event_id, athlete_id, registration_code, bib_number, full_name, email, birth_date, gender, category, modality, country_code, city, status, claimed_at, created_at, updated_at").order("full_name", { ascending: true });
    if (eventId) query = query.eq("event_id", eventId);
    const { data: registrations, error } = await query;
    if (error) {
      if (error.code === "42P01") return NextResponse.json({ module_ready: false, events: events ?? [], registrations: [], summary: null });
      throw error;
    }
    const athleteIds = [...new Set((registrations ?? []).map((item) => item.athlete_id).filter(Boolean))];
    const { data: athletes, error: athleteError } = athleteIds.length
      ? await supabase.from("athletes").select("id, strava_athlete_id, full_name, category, bib_number").in("id", athleteIds)
      : { data: [], error: null };
    if (athleteError) throw athleteError;
    const athleteMap = new Map((athletes ?? []).map((athlete) => [athlete.id, athlete]));
    const items = (registrations ?? []).map((item) => ({ ...item, athlete: item.athlete_id ? athleteMap.get(item.athlete_id) ?? null : null }));
    const summary = {
      total: items.length, confirmed: items.filter((item) => item.status === "confirmed").length,
      pending: items.filter((item) => item.status === "pending").length, waitlist: items.filter((item) => item.status === "waitlist").length,
      cancelled: items.filter((item) => item.status === "cancelled").length, linked: items.filter((item) => Boolean(item.athlete_id)).length,
    };
    return NextResponse.json({ module_ready: true, events: events ?? [], registrations: items, summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar inscritos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json() as { action?: string; eventId?: string; rows?: RegistrationInput[]; registration?: RegistrationInput };
    const supabase = createSupabaseAdmin();
    if (body.action === "import") {
      const eventId = String(body.eventId ?? "").trim();
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, 1000) : [];
      if (!eventId || !rows.length) return NextResponse.json({ error: "Selecione o evento e envie ao menos uma linha." }, { status: 400 });
      const normalized = rows.map((row) => normalizeInput(row, eventId));
      const { data, error } = await supabase.from("registrations").upsert(normalized, { onConflict: "event_id,email" }).select("*");
      if (error) throw error;
      for (const registration of data ?? []) await syncLinkedAthlete(supabase, registration);
      return NextResponse.json({ imported: data?.length ?? 0 });
    }
    const normalized = normalizeInput(body.registration ?? (body as RegistrationInput));
    const { data, error } = await supabase.from("registrations").insert(normalized).select("*").single();
    if (error) throw error;
    return NextResponse.json({ registration: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao cadastrar inscrição." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json() as { id?: string; registration?: RegistrationInput };
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "Inscrição não identificada." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const normalized = normalizeInput(body.registration ?? {});
    const { data, error } = await supabase.from("registrations").update(normalized).eq("id", id).select("*").single();
    if (error) throw error;
    await syncLinkedAthlete(supabase, data);
    return NextResponse.json({ registration: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao atualizar inscrição." }, { status: 500 });
  }
}
