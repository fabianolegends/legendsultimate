import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { recordAdminAudit } from "@/lib/admin-audit";

const extendedFields = "id, slug, name, timezone, status, starts_on, ends_on, description, location, event_type, scoring_mode, registration_source, access_mode, participant_limit, is_test, registration_open, registration_closes_at, windfit_registration_url, terms_url, registration_fee_cents, experience_fee_cents, asaas_checkout_expires_minutes, asaas_max_installments, premium_kit_enabled, premium_kit_fee_cents, casual_shirt_required, senior_discount_enabled, senior_discount_percent, regulation_version, created_at, updated_at";
const baseFields = "id, slug, name, timezone, status, starts_on, ends_on, created_at, updated_at";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function databaseError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error) {
    const candidate = error as { message?: unknown; details?: unknown; hint?: unknown };
    const parts = [candidate.message, candidate.details, candidate.hint]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    if (parts.length) return [...new Set(parts)].join(" ");
  }
  return fallback;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function dateAtOffset(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function optionalPositiveInteger(value: unknown) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function normalizedLots(value: unknown) {
  if (!Array.isArray(value)) return null;
  const lots = value.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const name = String(row.name ?? `Lote ${index + 1}`).trim();
    const startsAt = String(row.starts_at ?? "").trim();
    const endsAt = String(row.ends_at ?? "").trim();
    const startsAtMs = new Date(startsAt).getTime();
    const endsAtMs = new Date(endsAt).getTime();
    const registrationFeeCents = optionalPositiveInteger(
      row.registration_fee_cents,
    );
    if (!name || !startsAt || !endsAt || !registrationFeeCents)
      throw new Error("Preencha nome, início, fim e valor de todos os lotes.");
    if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs))
      throw new Error(`Informe datas válidas para o ${name}.`);
    if (endsAtMs <= startsAtMs)
      throw new Error(`A data final do ${name} deve ser posterior à inicial.`);
    return {
      name,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      registration_fee_cents: registrationFeeCents,
      display_order: index + 1,
      updated_at: new Date().toISOString(),
    };
  });
  const ordered = [...lots].sort(
    (left, right) =>
      new Date(left.starts_at).getTime() -
      new Date(right.starts_at).getTime(),
  );
  for (let index = 1; index < ordered.length; index += 1) {
    if (
      new Date(ordered[index].starts_at).getTime() <=
      new Date(ordered[index - 1].ends_at).getTime()
    )
      throw new Error("Os períodos dos lotes não podem se sobrepor.");
  }
  return lots;
}

async function saveLots(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  eventId: string,
  lots: ReturnType<typeof normalizedLots>,
) {
  if (lots === null) return;
  if (!lots.length) {
    const { error } = await supabase
      .from("registration_lots")
      .delete()
      .eq("event_id", eventId);
    if (error) throw error;
    return;
  }
  const displayOrders = lots.map((lot) => lot.display_order);
  const { error } = await supabase.from("registration_lots").upsert(
    lots.map((lot) => ({ ...lot, event_id: eventId })),
    { onConflict: "event_id,display_order" },
  );
  if (error) throw error;
  const existing = await supabase
    .from("registration_lots")
    .select("display_order")
    .eq("event_id", eventId);
  if (existing.error) throw existing.error;
  const staleOrders = (existing.data ?? [])
    .map((lot) => lot.display_order)
    .filter((displayOrder) => !displayOrders.includes(displayOrder));
  if (staleOrders.length) {
    const stale = await supabase
      .from("registration_lots")
      .delete()
      .eq("event_id", eventId)
      .in("display_order", staleOrders);
    if (stale.error) throw stale.error;
  }
}

async function eventCounts(supabase: ReturnType<typeof createSupabaseAdmin>) {
  const [{ data: stages }, { data: registrations }, lotsResult] = await Promise.all([
    supabase.from("stages").select("id, event_id, stage_number, name, route_label, stage_date, classification_weight, time_limit_s, results_published").order("stage_number", { ascending: true }),
    supabase.from("registrations").select("event_id"),
    supabase.from("registration_lots").select("id, event_id, name, starts_at, ends_at, registration_fee_cents, display_order").order("display_order", { ascending: true }),
  ]);
  const stageCounts = new Map<string, number>();
  const registrationCounts = new Map<string, number>();
  for (const row of stages ?? []) stageCounts.set(row.event_id, (stageCounts.get(row.event_id) ?? 0) + 1);
  for (const row of registrations ?? []) if (row.event_id) registrationCounts.set(row.event_id, (registrationCounts.get(row.event_id) ?? 0) + 1);
  const stagesByEvent = new Map<string, NonNullable<typeof stages>>();
  for (const stage of stages ?? []) {
    const rows = stagesByEvent.get(stage.event_id) ?? [];
    rows.push(stage);
    stagesByEvent.set(stage.event_id, rows);
  }
  const lotsByEvent = new Map<string, NonNullable<typeof lotsResult.data>>();
  if (!lotsResult.error) {
    for (const lot of lotsResult.data ?? []) {
      const rows = lotsByEvent.get(lot.event_id) ?? [];
      rows.push(lot);
      lotsByEvent.set(lot.event_id, rows);
    }
  }
  return { stageCounts, registrationCounts, stagesByEvent, lotsByEvent };
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
  const { stageCounts, registrationCounts, stagesByEvent, lotsByEvent } = await eventCounts(supabase);
  const events = (data ?? []).map((event) => ({
    ...event,
    stage_count: stageCounts.get(event.id) ?? 0,
    registration_count: registrationCounts.get(event.id) ?? 0,
    stages: stagesByEvent.get(event.id) ?? [],
    registration_lots: lotsByEvent.get(event.id) ?? [],
  }));
  return NextResponse.json({ events, module_ready: moduleReady });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
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
    const registrationSource = String(body.registration_source ?? "mixed");
    const registrationFeeCents = optionalPositiveInteger(body.registration_fee_cents);
    const experienceFeeCents = optionalPositiveInteger(body.experience_fee_cents);
    const premiumKitEnabled = body.premium_kit_enabled === true;
    const premiumKitFeeCents = optionalPositiveInteger(
      body.premium_kit_fee_cents,
    );
    const lots = normalizedLots(body.registration_lots);
    if (registrationSource === "asaas" && !registrationFeeCents) {
      return NextResponse.json({ error: "Informe o valor da inscrição para ativar o checkout Asaas." }, { status: 400 });
    }
    if (premiumKitEnabled && !premiumKitFeeCents)
      return NextResponse.json(
        { error: "Informe o valor do Kit Premium." },
        { status: 400 },
      );
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
      registration_source: registrationSource,
      access_mode: String(body.access_mode ?? "invite"),
      participant_limit: Number.isFinite(participantLimit) ? participantLimit : null,
      is_test: body.is_test === true,
      registration_open: body.registration_open === true,
      registration_closes_at: String(body.registration_closes_at ?? "").trim() || null,
      windfit_registration_url: String(body.windfit_registration_url ?? "").trim() || null,
      terms_url: String(body.terms_url ?? "").trim() || null,
      registration_fee_cents: registrationFeeCents,
      experience_fee_cents: experienceFeeCents,
      asaas_checkout_expires_minutes: boundedInteger(body.asaas_checkout_expires_minutes, 120, 10, 1440),
      asaas_max_installments: boundedInteger(body.asaas_max_installments, 1, 1, 21),
      premium_kit_enabled: premiumKitEnabled,
      premium_kit_fee_cents: premiumKitEnabled ? premiumKitFeeCents : null,
      casual_shirt_required: body.casual_shirt_required === true,
      senior_discount_enabled: body.senior_discount_enabled === true,
      senior_discount_percent: boundedInteger(
        body.senior_discount_percent,
        50,
        50,
        100,
      ),
      regulation_version:
        String(body.regulation_version ?? "").trim() || null,
    }).select(extendedFields).single();
    if (error?.code === "42703") return NextResponse.json({ error: "Execute as migrations 012, 022 e 024 no Supabase." }, { status: 409 });
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
    await saveLots(supabase, event.id, lots);
    await recordAdminAudit(request, { action: "event.created", resourceType: "event", resourceId: event.id, eventId: event.id, details: { name, stage_count: stageCount } });
    return NextResponse.json({ event: { ...event, stage_count: stageCount, registration_count: 0 } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível criar o evento." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventId = String(body.event_id ?? "").trim();
    if (!eventId) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    const requestedSource = "registration_source" in body ? String(body.registration_source ?? "") : null;
    const requestedFee = "registration_fee_cents" in body ? optionalPositiveInteger(body.registration_fee_cents) : undefined;
    if (requestedSource === "asaas" && !requestedFee) {
      return NextResponse.json({ error: "Informe o valor da inscrição para ativar o checkout Asaas." }, { status: 400 });
    }
    const premiumKitEnabled =
      "premium_kit_enabled" in body
        ? body.premium_kit_enabled === true
        : undefined;
    const premiumKitFee =
      "premium_kit_fee_cents" in body
        ? optionalPositiveInteger(body.premium_kit_fee_cents)
        : undefined;
    if (premiumKitEnabled === true && !premiumKitFee)
      return NextResponse.json(
        { error: "Informe o valor do Kit Premium." },
        { status: 400 },
      );
    const lots = normalizedLots(body.registration_lots);
    const fields = ["name", "slug", "starts_on", "ends_on", "timezone", "status", "description", "location", "event_type", "scoring_mode", "registration_source", "access_mode", "participant_limit", "is_test", "registration_open", "registration_closes_at", "windfit_registration_url", "terms_url", "registration_fee_cents", "experience_fee_cents", "asaas_checkout_expires_minutes", "asaas_max_installments", "premium_kit_enabled", "premium_kit_fee_cents", "casual_shirt_required", "senior_discount_enabled", "senior_discount_percent", "regulation_version"] as const;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of fields) {
      if (!(field in body)) continue;
      if (field === "slug") payload[field] = slugify(String(body[field] ?? ""));
      else if (field === "registration_fee_cents" || field === "experience_fee_cents") payload[field] = optionalPositiveInteger(body[field]);
      else if (field === "premium_kit_fee_cents")
        payload[field] =
          body.premium_kit_enabled === false
            ? null
            : optionalPositiveInteger(body[field]);
      else if (field === "asaas_checkout_expires_minutes") payload[field] = boundedInteger(body[field], 120, 10, 1440);
      else if (field === "asaas_max_installments") payload[field] = boundedInteger(body[field], 1, 1, 21);
      else if (field === "senior_discount_percent")
        payload[field] = boundedInteger(body[field], 50, 50, 100);
      else payload[field] = body[field];
    }
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from("events").update(payload).eq("id", eventId).select(extendedFields).single();
    if (error?.code === "42703") return NextResponse.json({ error: "Execute as migrations 012, 022 e 024 no Supabase." }, { status: 409 });
    if (error) throw error;
    await saveLots(supabase, eventId, lots);
    await recordAdminAudit(request, { action: "event.updated", resourceType: "event", resourceId: eventId, eventId, details: { fields: Object.keys(payload).filter((field) => field !== "updated_at") } });
    return NextResponse.json({ event: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o evento." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventId = String(body.event_id ?? "").trim();
    const confirmation = String(body.confirmation ?? "");
    if (!eventId || !confirmation) return NextResponse.json({ error: "Evento e confirmação são obrigatórios." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, name, slug, status, is_test, registration_open")
      .eq("id", eventId)
      .single();
    if (eventError?.code === "PGRST116") return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    if (eventError || !event) throw eventError ?? new Error("Evento não encontrado.");
    if (event.is_test !== true) return NextResponse.json({ error: "Somente eventos marcados como teste podem ser excluídos pelo painel." }, { status: 409 });
    if (event.status !== "draft" || event.registration_open === true) {
      return NextResponse.json({ error: "Antes de excluir, deixe o evento em Rascunho e feche as inscrições." }, { status: 409 });
    }
    const requiredConfirmation = `EXCLUIR ${event.name}`;
    if (confirmation !== requiredConfirmation) return NextResponse.json({ error: "A confirmação digitada não corresponde ao nome do evento." }, { status: 400 });

    const { data: stages, error: stageError } = await supabase.from("stages").select("id").eq("event_id", eventId);
    if (stageError) throw stageError;
    const stageIds = (stages ?? []).map((stage) => stage.id);
    const [{ data: registrations, error: registrationError }, routeResponse] = await Promise.all([
      supabase.from("registrations").select("athlete_id").eq("event_id", eventId),
      stageIds.length
        ? supabase.from("route_versions").select("storage_path").in("stage_id", stageIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (registrationError) throw registrationError;
    if (routeResponse.error) throw routeResponse.error;
    const athleteIds = [...new Set((registrations ?? []).map((row) => row.athlete_id).filter((id): id is string => Boolean(id)))];
    const storagePaths = (routeResponse.data ?? []).map((route) => route.storage_path).filter((path): path is string => Boolean(path));

    const { error: cleanupError } = await supabase.rpc("cleanup_test_event_data", {
      p_event_id: eventId,
      p_confirmation: `LIMPAR ${event.name}`,
      p_actor_reference: "event-deletion",
    });
    if (cleanupError) throw cleanupError;

    await recordAdminAudit(request, {
      action: "test_event.deleted",
      resourceType: "event",
      resourceId: eventId,
      eventId,
      details: { name: event.name, slug: event.slug, stages: stageIds.length, candidate_athletes: athleteIds.length },
    });
    const { error: deleteError } = await supabase.from("events").delete().eq("id", eventId);
    if (deleteError) throw deleteError;

    if (storagePaths.length) await supabase.storage.from("official-routes").remove(storagePaths);

    let removedFixtureAthletes = 0;
    if (athleteIds.length) {
      const [{ data: remainingRegistrations }, { data: remainingActivities }, { data: fixtureAthletes }] = await Promise.all([
        supabase.from("registrations").select("athlete_id").in("athlete_id", athleteIds),
        supabase.from("activities").select("athlete_id").in("athlete_id", athleteIds),
        supabase.from("athletes").select("id, email, auth_user_id, ride_with_gps_user_id").in("id", athleteIds),
      ]);
      const retained = new Set([
        ...(remainingRegistrations ?? []).map((row) => row.athlete_id),
        ...(remainingActivities ?? []).map((row) => row.athlete_id),
      ]);
      const disposable = (fixtureAthletes ?? [])
        .filter((athlete) => !retained.has(athlete.id) && !athlete.auth_user_id && !athlete.ride_with_gps_user_id && String(athlete.email ?? "").endsWith("@legends.invalid"))
        .map((athlete) => athlete.id);
      if (disposable.length) {
        const { error: athleteDeleteError } = await supabase.from("athletes").delete().in("id", disposable);
        if (!athleteDeleteError) removedFixtureAthletes = disposable.length;
      }
    }

    return NextResponse.json({ deleted: true, event_id: eventId, removed_fixture_athletes: removedFixtureAthletes });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined;
    if (code === "42883") {
      return NextResponse.json({ error: "Execute a migration 017_safe_test_data_cleanup.sql no Supabase." }, { status: 409 });
    }
    if (code === "42501" || code === "23503") {
      return NextResponse.json({ error: "A auditoria imutável está bloqueando a exclusão. Execute a migration 020_safe_test_event_deletion.sql no Supabase." }, { status: 409 });
    }
    return NextResponse.json({ error: databaseError(error, "Não foi possível excluir o evento.") }, { status: 500 });
  }
}
