import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";
import { normalizeRegistrationCode, normalizeRegistrationEmail } from "@/lib/registration-access";

export const runtime = "nodejs";

type RegistrationInput = {
  event_id?: string; registration_code?: string; bib_number?: string | null; full_name?: string; email?: string;
  birth_date?: string | null; gender?: string | null; category?: string | null; modality?: string;
  country_code?: string | null; city?: string | null; status?: string; source?: string;
  external_registration_id?: string | null; payment_status?: string; imported_at?: string | null; last_synced_at?: string | null;
  phone?: string | null; location?: string | null; registered_at?: string | null;
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

function normalizeDateTime(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const brazilian = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (brazilian) return `${brazilian[3]}-${brazilian[2].padStart(2,"0")}-${brazilian[1].padStart(2,"0")}T${(brazilian[4]??"00").padStart(2,"0")}:${brazilian[5]??"00"}:${brazilian[6]??"00"}-03:00`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeGender(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  if (["m", "masculino", "male", "homem"].includes(text)) return "male";
  if (["f", "feminino", "female", "mulher"].includes(text)) return "female";
  return "other";
}

function normalizeStatus(value: unknown) {
  const text = normalizeText(value);
  if (["pending", "pendente", "aguardando", "em aberto"].includes(text)) return "pending";
  if (["waitlist", "lista_de_espera", "lista de espera", "espera"].includes(text)) return "waitlist";
  if (["cancelled", "canceled", "cancelada", "cancelado", "estornada", "estornado"].includes(text)) return "cancelled";
  return "confirmed";
}

function normalizePaymentStatus(value: unknown, registrationStatus: string, source: string) {
  const text = normalizeText(value);
  if (["paid", "pago", "aprovado", "aprovada", "aprovado pelo organizador", "aprovada pelo organizador", "confirmado", "confirmada", "payment approved"].includes(text)) return "paid";
  if (["refunded", "reembolsado", "reembolsada", "estornado", "estornada"].includes(text)) return "refunded";
  if (["cancelled", "canceled", "cancelado", "cancelada"].includes(text)) return "cancelled";
  if (["courtesy", "cortesia", "convidado", "convidada", "isento", "isenta", "gratis", "gratuito", "gratuita"].includes(text)) return "courtesy";
  if (["pending", "pendente", "aguardando", "em aberto", "boleto pendente"].includes(text)) return "pending";
  if (source === "manual" && registrationStatus === "confirmed") return "courtesy";
  return "pending";
}

function normalizeModality(value: unknown) {
  const text = normalizeText(value);
  return text.includes("experience") || text.includes("turismo") || text.includes("e-bike") ? "experience" : "gravel_race";
}

function normalizeInput(input: RegistrationInput, options?: { forcedEventId?: string; forcedSource?: "windfit" | "manual" | "online" }) {
  const eventId = String(options?.forcedEventId ?? input.event_id ?? "").trim();
  const fullName = String(input.full_name ?? "").trim();
  const email = normalizeRegistrationEmail(String(input.email ?? ""));
  if (!eventId || !fullName || !email) throw new Error("Evento, nome completo e e-mail são obrigatórios.");

  const source = options?.forcedSource ?? (input.source === "windfit" ? "windfit" : input.source === "online" ? "online" : "manual");
  let status = normalizeStatus(input.status);
  const paymentStatus = normalizePaymentStatus(input.payment_status, status, source);
  if (["refunded", "cancelled"].includes(paymentStatus)) status = "cancelled";
  if (paymentStatus === "pending" && status === "confirmed" && source === "windfit") status = "pending";
  const now = new Date().toISOString();

  return {
    event_id: eventId,
    registration_code: normalizeRegistrationCode(String(input.registration_code ?? "")) || makeRegistrationCode(),
    bib_number: source === "windfit" ? null : cleanNullable(input.bib_number),
    full_name: fullName,
    email,
    birth_date: normalizeDate(input.birth_date),
    gender: normalizeGender(input.gender),
    category: cleanNullable(input.category),
    modality: normalizeModality(input.modality),
    country_code: cleanNullable(input.country_code)?.toUpperCase() ?? null,
    city: cleanNullable(input.city),
    status,
    source,
    external_registration_id: cleanNullable(input.external_registration_id),
    phone: cleanNullable(input.phone),
    location: cleanNullable(input.location),
    registered_at: normalizeDateTime(input.registered_at),
    payment_status: paymentStatus,
    imported_at: source === "windfit" ? (input.imported_at || now) : (input.imported_at || null),
    last_synced_at: source === "windfit" ? now : (input.last_synced_at || null),
    updated_at: now,
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
    const baseFields = "id, event_id, athlete_id, registration_code, bib_number, full_name, email, birth_date, gender, category, modality, country_code, city, status, claimed_at, created_at, updated_at, source, external_registration_id, payment_status, imported_at, last_synced_at";
    const fields = `${baseFields}, phone, location, registered_at`;
    let query = supabase.from("registrations").select(fields).order("full_name", { ascending: true });
    if (eventId) query = query.eq("event_id", eventId);
    let { data: registrations, error } = await query;
    let detailsReady = true;
    if (error?.code === "42703") {
      detailsReady = false;
      let fallbackQuery = supabase.from("registrations").select(baseFields).order("full_name", { ascending: true });
      if (eventId) fallbackQuery = fallbackQuery.eq("event_id", eventId);
      const fallback = await fallbackQuery;
      registrations = fallback.data as typeof registrations;
      error = fallback.error;
    }
    if (error) {
      if (error.code === "42P01") return NextResponse.json({ module_ready: false, windfit_ready: false, events: events ?? [], registrations: [], summary: null });
      if (error.code === "42703") return NextResponse.json({ module_ready: true, windfit_ready: false, details_ready: false, events: events ?? [], registrations: [], summary: null, message: "Execute as migrations pendentes do Supabase." });
      throw error;
    }
    const athleteIds = [...new Set((registrations ?? []).map((item) => item.athlete_id).filter(Boolean))];
    const { data: athletes, error: athleteError } = athleteIds.length
      ? await supabase.from("athletes").select("id, ride_with_gps_user_id, full_name, category, bib_number").in("id", athleteIds)
      : { data: [], error: null };
    if (athleteError) throw athleteError;
    const athleteMap = new Map((athletes ?? []).map((athlete) => [athlete.id, athlete]));
    const items = (registrations ?? []).map((item) => ({ ...item, athlete: item.athlete_id ? athleteMap.get(item.athlete_id) ?? null : null }));
    let identityReady = true;
    let linkAudit: unknown[] = [];
    if (eventId) {
      const auditQuery = await supabase.from("registration_link_audit")
        .select("id, event_id, registration_id, previous_athlete_id, athlete_id, ride_with_gps_user_id, action, actor_type, actor_reference, reason, created_at")
        .eq("event_id", eventId).order("created_at", { ascending: false }).limit(200);
      if (auditQuery.error?.code === "42P01") identityReady = false;
      else if (auditQuery.error) throw auditQuery.error;
      else linkAudit = auditQuery.data ?? [];
    }
    const lastSync = items.map((item) => item.last_synced_at).filter(Boolean).sort().at(-1) ?? null;
    const summary = {
      total: items.length,
      eligible: items.filter((item) => item.status === "confirmed" && ["paid", "courtesy"].includes(item.payment_status)).length,
      paid: items.filter((item) => item.payment_status === "paid").length,
      payment_pending: items.filter((item) => item.payment_status === "pending").length,
      refunded: items.filter((item) => item.payment_status === "refunded").length,
      cancelled: items.filter((item) => item.status === "cancelled" || item.payment_status === "cancelled").length,
      linked: items.filter((item) => Boolean(item.athlete_id)).length,
      last_sync: lastSync,
    };
    let numberingReady = true;
    let sequences: unknown[] = [];
    if (eventId) {
      const sequenceQuery = await supabase.from("event_category_bib_sequences")
        .select("id, event_id, category, start_number, next_number, padding, updated_at")
        .eq("event_id", eventId).order("start_number", { ascending: true });
      if (sequenceQuery.error?.code === "42P01") numberingReady = false;
      else if (sequenceQuery.error) throw sequenceQuery.error;
      else sequences = sequenceQuery.data ?? [];
    }
    return NextResponse.json({ module_ready: true, windfit_ready: true, details_ready: detailsReady, numbering_ready: numberingReady, identity_ready: identityReady, link_audit: linkAudit, sequences, events: events ?? [], registrations: items, summary, message: detailsReady ? undefined : "Execute a migration 010_windfit_registration_details.sql para importar telefone, localização e data da inscrição." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar inscritos Windfit." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "registrations.manage")) return unauthorized();
  try {
    const body = await request.json() as { action?: string; id?: string; fromId?: string; toId?: string; reason?: string; eventId?: string; rows?: RegistrationInput[]; registration?: RegistrationInput; sequences?: Array<{ category?: string; start_number?: number; padding?: number }> };
    const supabase = createSupabaseAdmin();
    if (body.action === "unlink_registration") {
      const id = String(body.id ?? "").trim();
      if (!id) return NextResponse.json({ error: "Inscrição não identificada." }, { status: 400 });
      const unlinkResult = await supabase.rpc("unlink_registration_identity", {
        p_registration_id: id,
        p_actor_type: "admin",
        p_actor_reference: "organization-passport",
        p_reason: String(body.reason ?? "Correção administrativa de vínculo").trim(),
      });
      if (unlinkResult.error?.code === "PGRST202" || unlinkResult.error?.code === "42883") {
        return NextResponse.json({ error: "Execute a migration 016_athlete_identity_integrity.sql no Supabase." }, { status: 409 });
      }
      if (unlinkResult.error) throw unlinkResult.error;
      return NextResponse.json({ unlinked: true });
    }
    if (body.action === "transfer_registration_identity") {
      const fromId = String(body.fromId ?? "").trim();
      const toId = String(body.toId ?? "").trim();
      if (!fromId || !toId) return NextResponse.json({ error: "Informe as inscrições de origem e destino." }, { status: 400 });
      const transfer = await supabase.rpc("transfer_registration_identity", {
        p_from_registration_id: fromId,
        p_to_registration_id: toId,
        p_actor_reference: "organization-passport",
        p_reason: String(body.reason ?? "Correção administrativa de vínculo").trim(),
      });
      if (transfer.error?.code === "PGRST202" || transfer.error?.code === "42883") {
        return NextResponse.json({ error: "Execute a migration 016_athlete_identity_integrity.sql no Supabase." }, { status: 409 });
      }
      if (transfer.error?.code === "P0001" || transfer.error?.code === "23505") {
        return NextResponse.json({ error: transfer.error.message }, { status: 409 });
      }
      if (transfer.error) throw transfer.error;
      return NextResponse.json({ transferred: true });
    }
    if (body.action === "configure_bib_sequences") {
      const eventId = String(body.eventId ?? "").trim();
      const sequences = Array.isArray(body.sequences) ? body.sequences.slice(0, 50) : [];
      if (!eventId || !sequences.length) return NextResponse.json({ error: "Selecione o evento e configure ao menos uma categoria." }, { status: 400 });
      let assigned = 0;
      for (const item of sequences) {
        const category = String(item.category ?? "").trim();
        const startNumber = Number(item.start_number);
        const padding = Number(item.padding ?? 3);
        if (!category || !Number.isInteger(startNumber) || startNumber < 1 || !Number.isInteger(padding) || padding < 1 || padding > 8) {
          return NextResponse.json({ error: `Configuração inválida para a categoria ${category || "sem nome"}.` }, { status: 400 });
        }
        const { data, error } = await supabase.rpc("configure_event_category_bib_sequence", {
          p_event_id: eventId, p_category: category, p_start_number: startNumber, p_padding: padding,
        });
        if (error?.code === "PGRST202" || error?.code === "42883") return NextResponse.json({ error: "Execute a migration 014_category_bib_sequences.sql no Supabase." }, { status: 409 });
        if (error) throw error;
        assigned += Number(data ?? 0);
      }
      return NextResponse.json({ configured: sequences.length, assigned });
    }
    if (body.action === "import_windfit" || body.action === "import") {
      const eventId = String(body.eventId ?? "").trim();
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, 3000) : [];
      if (!eventId || !rows.length) return NextResponse.json({ error: "Selecione o evento e envie ao menos uma linha da Windfit." }, { status: 400 });
      const emails = [...new Set(rows.map((row) => normalizeRegistrationEmail(String(row.email ?? ""))).filter(Boolean))];
      const { data: existing, error: existingError } = emails.length
        ? await supabase.from("registrations").select("email, registration_code").eq("event_id", eventId).in("email", emails)
        : { data: [], error: null };
      if (existingError) throw existingError;
      const codeByEmail = new Map((existing ?? []).map((registration) => [normalizeRegistrationEmail(registration.email), registration.registration_code]));
      const normalized = rows.map((row) => normalizeInput({ ...row, registration_code: row.registration_code || codeByEmail.get(normalizeRegistrationEmail(String(row.email ?? ""))) }, { forcedEventId: eventId, forcedSource: "windfit" }));
      const { data, error } = await supabase.from("registrations").upsert(normalized, { onConflict: "event_id,email" }).select("*");
      if (error?.code === "42703") return NextResponse.json({ error: "Execute a migration 010_windfit_registration_details.sql antes de importar este arquivo." }, { status: 409 });
      if (error) throw error;
      for (const registration of data ?? []) await syncLinkedAthlete(supabase, registration);
      return NextResponse.json({ imported: data?.length ?? 0, synced_at: new Date().toISOString() });
    }
    const normalized = normalizeInput(body.registration ?? (body as RegistrationInput), { forcedSource: "manual" });
    const { data, error } = await supabase.from("registrations").insert(normalized).select("*").single();
    if (error) throw error;
    return NextResponse.json({ registration: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao cadastrar inscrição." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "registrations.manage")) return unauthorized();
  try {
    const body = await request.json() as { id?: string; registration?: RegistrationInput };
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "Inscrição não identificada." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data: current, error: currentError } = await supabase.from("registrations").select("source").eq("id", id).single();
    if (currentError) throw currentError;
    const forcedSource = current?.source === "windfit" ? "windfit" : current?.source === "online" ? "online" : "manual";
    const normalized = normalizeInput(body.registration ?? {}, { forcedSource });
    const { data, error } = await supabase.from("registrations").update(normalized).eq("id", id).select("*").single();
    if (error) throw error;
    await syncLinkedAthlete(supabase, data);
    return NextResponse.json({ registration: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao atualizar inscrição." }, { status: 500 });
  }
}
