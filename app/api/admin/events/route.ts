import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const extendedFields = "id, slug, name, timezone, status, starts_on, ends_on, description, location, event_type, scoring_mode, registration_source, access_mode, participant_limit, is_test, created_at, updated_at";
const baseFields = "id, slug, name, timezone, status, starts_on, ends_on, created_at, updated_at";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function dateAtOffset(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

async function eventCounts(supabase: ReturnType<typeof createSupabaseAdmin>) {
  const [{ data: stages }, { data: registrations }] = await Promise.all([
    supabase.from("stages").select("event_id"),
    supabase.from("registrations").select("event_id"),
  ]);
  const stageCounts = new Map<string, number>();
  const registrationCounts = new Map<string, number>();
  for (const row of stages ?? []) stageCounts.set(row.event_id, (stageCounts.get(row.event_id) ?? 0) + 1);
  for (const row of registrations ?? []) if (row.event_id) registrationCounts.set(row.event_id, (registrationCounts.get(row.event_id) ?? 0) + 1);
  return { stageCounts, registrationCounts };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const supabase = createSupabaseAdmin();
  let moduleReady = true;
  let { data, error } = await supabase.from("events").select(extendedFields).order("starts_on", { ascending: false, nullsFirst: false });
  if (error?.code === "42703") {
    moduleReady = false;
    const fallback = await supabase.from("events").select(baseFields).order("starts_on", { ascending: false, nullsFirst: false });
    data = fallback.data as typeof data;
    error = fallback.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { stageCounts, registrationCounts } = await eventCounts(supabase);
  const events = (data ?? []).map((event) => ({
    ...event,
    stage_count: stageCounts.get(event.id) ?? 0,
    registration_count: registrationCounts.get(event.id) ?? 0,
  }));
  return NextResponse.json({ events, module_ready: moduleReady });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const startsOn = String(body.starts_on ?? "").trim();
    const endsOn = String(body.ends_on ?? startsOn).trim();
    const stageCount = Math.min(20, Math.max(1, Math.round(Number(body.stage_count ?? 1))));
    if (!name || !startsOn || !endsOn) return NextResponse.json({ error: "Nome e datas do evento são obrigatórios." }, { status: 400 });
    if (endsOn < startsOn) return NextResponse.json({ error: "A data final não pode ser anterior à data inicial." }, { status: 400 });
    const requestedSlug = String(body.slug ?? "").trim();
    const slug = slugify(requestedSlug || name);
    if (!slug) return NextResponse.json({ error: "Informe um nome válido para gerar o endereço do evento." }, { status: 400 });

    const participantLimit = body.participant_limit ? Number(body.participant_limit) : null;
    const supabase = createSupabaseAdmin();
    const { data: event, error } = await supabase.from("events").insert({
      name,
      slug,
      starts_on: startsOn,
      ends_on: endsOn,
      timezone: String(body.timezone ?? "America/Sao_Paulo"),
      status: String(body.status ?? "draft"),
      description: String(body.description ?? "").trim() || null,
      location: String(body.location ?? "").trim() || null,
      event_type: String(body.event_type ?? "adventure"),
      scoring_mode: String(body.scoring_mode ?? "weighted_points"),
      registration_source: String(body.registration_source ?? "mixed"),
      access_mode: String(body.access_mode ?? "invite"),
      participant_limit: Number.isFinite(participantLimit) ? participantLimit : null,
      is_test: body.is_test === true,
    }).select(extendedFields).single();
    if (error?.code === "42703") return NextResponse.json({ error: "Execute a migration 012_multi_event_management.sql no Supabase." }, { status: 409 });
    if (error?.code === "23505") return NextResponse.json({ error: "Já existe um evento com esse identificador." }, { status: 409 });
    if (error) throw error;

    const stages = Array.from({ length: stageCount }, (_, index) => ({
      event_id: event.id,
      stage_number: index + 1,
      name: stageCount === 1 ? name : `Dia ${index + 1}`,
      route_label: `Percurso ${index + 1}`,
      stage_date: dateAtOffset(startsOn, index),
      classification_weight: 1,
    }));
    const { error: stagesError } = await supabase.from("stages").insert(stages);
    if (stagesError) throw stagesError;
    return NextResponse.json({ event: { ...event, stage_count: stageCount, registration_count: 0 } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível criar o evento." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventId = String(body.event_id ?? "").trim();
    if (!eventId) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    const fields = ["name", "slug", "starts_on", "ends_on", "timezone", "status", "description", "location", "event_type", "scoring_mode", "registration_source", "access_mode", "participant_limit", "is_test"] as const;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of fields) if (field in body) payload[field] = field === "slug" ? slugify(String(body[field] ?? "")) : body[field];
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from("events").update(payload).eq("id", eventId).select(extendedFields).single();
    if (error?.code === "42703") return NextResponse.json({ error: "Execute a migration 012_multi_event_management.sql no Supabase." }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ event: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o evento." }, { status: 500 });
  }
}
