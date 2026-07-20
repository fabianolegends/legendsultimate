import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { POST as validateRideWithGpsTrip } from "@/app/api/athlete/validate-ridewithgps/route";
import { isAdminRequest } from "@/lib/admin-auth";
import { localDateInSaoPaulo } from "@/lib/ridewithgps";
import { decryptActivityToken } from "@/lib/ridewithgps-token-vault";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

type Connection = {
  athlete_id: string;
  ride_with_gps_user_id: number;
  access_token_ciphertext: string;
  access_token_iv: string;
  access_token_tag: string;
  athlete?: { full_name?: string; email?: string } | Array<{ full_name?: string; email?: string }> | null;
};

type Trip = {
  id: number;
  name?: string;
  departed_at?: string | null;
  created_at?: string;
  activity_type?: string | null;
  stationary?: boolean;
};

type Detail = {
  athlete_id: string;
  ride_with_gps_user_id: number;
  trip_id?: number;
  outcome: "imported" | "skipped" | "error";
  reason: string;
};

function equalSecret(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function scheduledRequest(request: NextRequest) {
  const configured = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  return Boolean(configured && authorization.startsWith("Bearer ") && equalSecret(authorization.slice(7), configured));
}

function authorized(request: NextRequest) {
  return isAdminRequest(request, "results.review") || scheduledRequest(request);
}

function migrationMissing(error: { code?: string } | null | undefined) {
  return ["42P01", "42703"].includes(error?.code ?? "");
}

function athleteProfile(connection: Connection) {
  return Array.isArray(connection.athlete) ? connection.athlete[0] : connection.athlete;
}

async function invokeValidation(input: {
  request: NextRequest;
  token: string;
  connection: Connection;
  stageId: string;
  tripId: number;
}) {
  const profile = athleteProfile(input.connection);
  const internalUrl = new URL("/api/athlete/validate-ridewithgps", input.request.nextUrl.origin);
  const athleteCookie = encodeURIComponent(JSON.stringify({
    id: input.connection.ride_with_gps_user_id,
    name: profile?.full_name,
    email: profile?.email,
  }));
  const internalRequest = new NextRequest(internalUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `rwgps_access_token=${encodeURIComponent(input.token)}; rwgps_user=${athleteCookie}`,
    },
    body: JSON.stringify({ stageId: input.stageId, tripId: String(input.tripId) }),
  });
  return validateRideWithGpsTrip(internalRequest);
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  try {
    const supabase = createSupabaseAdmin();
    const [connections, latestRun] = await Promise.all([
      supabase.from("ride_with_gps_connections").select("status"),
      supabase.from("activity_sync_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (migrationMissing(connections.error) || migrationMissing(latestRun.error)) {
      return NextResponse.json({ module_ready: false, message: "Execute a migration 018_automatic_activity_ingestion.sql no Supabase." });
    }
    if (connections.error) throw connections.error;
    if (latestRun.error) throw latestRun.error;
    return NextResponse.json({
      module_ready: true,
      connections: {
        total: connections.data?.length ?? 0,
        active: connections.data?.filter((item) => item.status === "active").length ?? 0,
        error: connections.data?.filter((item) => item.status === "error").length ?? 0,
      },
      latest_run: latestRun.data ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao consultar a sincronização." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  const isScheduled = scheduledRequest(request) && !isAdminRequest(request);
  let runId: string | null = null;
  try {
    const body = await request.json().catch(() => ({})) as { maxConnections?: number };
    const maxConnections = Math.min(50, Math.max(1, Math.round(Number(body.maxConnections ?? 20))));
    const supabase = createSupabaseAdmin();
    const { data: run, error: runError } = await supabase.from("activity_sync_runs").insert({
      trigger_source: isScheduled ? "scheduled" : "manual",
      status: "running",
    }).select("id").single();
    if (migrationMissing(runError)) {
      return NextResponse.json({ error: "Execute a migration 018_automatic_activity_ingestion.sql no Supabase.", module_ready: false }, { status: 503 });
    }
    if (runError || !run) throw runError ?? new Error("Não foi possível iniciar a sincronização.");
    runId = run.id;

    const { data: connectionRows, error: connectionError } = await supabase
      .from("ride_with_gps_connections")
      .select("athlete_id, ride_with_gps_user_id, access_token_ciphertext, access_token_iv, access_token_tag, athlete:athletes(full_name,email)")
      .eq("status", "active")
      .order("last_sync_at", { ascending: true, nullsFirst: true })
      .limit(maxConnections);
    if (connectionError) throw connectionError;

    let tripsScanned = 0;
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const details: Detail[] = [];

    for (const connection of (connectionRows ?? []) as Connection[]) {
      const syncStartedAt = new Date().toISOString();
      let connectionErrorMessage: string | null = null;
      try {
        const token = decryptActivityToken({
          ciphertext: connection.access_token_ciphertext,
          iv: connection.access_token_iv,
          tag: connection.access_token_tag,
        });
        const tripsResponse = await fetch("https://ridewithgps.com/api/v1/trips.json?page=1&page_size=200", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          cache: "no-store",
        });
        if (!tripsResponse.ok) throw new Error(tripsResponse.status === 401 ? "Autorização Ride with GPS expirada." : `Ride with GPS respondeu com status ${tripsResponse.status}.`);
        const tripPayload = await tripsResponse.json() as { trips?: Trip[] };
        const trips = (tripPayload.trips ?? []).filter((trip) =>
          !trip.stationary && (trip.activity_type ?? "").toLowerCase().includes("cycling"),
        );
        tripsScanned += trips.length;

        const { data: registrations, error: registrationError } = await supabase
          .from("registrations")
          .select("event_id")
          .eq("athlete_id", connection.athlete_id)
          .eq("status", "confirmed")
          .in("payment_status", ["paid", "courtesy"]);
        if (registrationError) throw registrationError;
        const eventIds = [...new Set((registrations ?? []).map((item) => item.event_id))];
        if (!eventIds.length) {
          skipped += trips.length;
          details.push({ athlete_id: connection.athlete_id, ride_with_gps_user_id: connection.ride_with_gps_user_id, outcome: "skipped", reason: "Sem inscrição elegível vinculada." });
          await supabase.from("ride_with_gps_connections").update({ last_sync_at: syncStartedAt, last_success_at: syncStartedAt, last_error: null, updated_at: syncStartedAt }).eq("athlete_id", connection.athlete_id);
          continue;
        }

        const { data: stages, error: stageError } = await supabase
          .from("stages")
          .select("id, event_id, stage_date, results_locked")
          .in("event_id", eventIds)
          .eq("results_locked", false);
        if (stageError) throw stageError;
        const stageIds = (stages ?? []).map((stage) => stage.id);
        const { data: routes, error: routeError } = stageIds.length
          ? await supabase.from("route_versions").select("stage_id").in("stage_id", stageIds).eq("is_active", true)
          : { data: [], error: null };
        if (routeError) throw routeError;
        const readyStageIds = new Set((routes ?? []).map((route) => route.stage_id));

        const tripIds = trips.map((trip) => String(trip.id));
        const { data: existing, error: existingError } = tripIds.length
          ? await supabase.from("activities").select("source_activity_id").eq("source", "ride_with_gps").in("source_activity_id", tripIds)
          : { data: [], error: null };
        if (existingError) throw existingError;
        const importedTripIds = new Set((existing ?? []).map((activity) => activity.source_activity_id));

        for (const trip of trips) {
          if (importedTripIds.has(String(trip.id))) {
            skipped += 1;
            continue;
          }
          const startedAt = trip.departed_at ?? trip.created_at;
          if (!startedAt) {
            skipped += 1;
            details.push({ athlete_id: connection.athlete_id, ride_with_gps_user_id: connection.ride_with_gps_user_id, trip_id: trip.id, outcome: "skipped", reason: "Atividade sem data." });
            continue;
          }
          const tripDate = localDateInSaoPaulo(startedAt);
          const matches = (stages ?? []).filter((stage) => stage.stage_date === tripDate && readyStageIds.has(stage.id));
          if (matches.length !== 1) {
            skipped += 1;
            if (matches.length > 1) {
              errors += 1;
              details.push({ athlete_id: connection.athlete_id, ride_with_gps_user_id: connection.ride_with_gps_user_id, trip_id: trip.id, outcome: "error", reason: "Mais de uma etapa elegível ocorre nesta data; associação manual necessária." });
            }
            continue;
          }
          const validationResponse = await invokeValidation({ request, token, connection, stageId: matches[0].id, tripId: trip.id });
          const validationPayload = await validationResponse.json() as { error?: string };
          if (!validationResponse.ok) {
            errors += 1;
            details.push({ athlete_id: connection.athlete_id, ride_with_gps_user_id: connection.ride_with_gps_user_id, trip_id: trip.id, outcome: "error", reason: validationPayload.error ?? "Falha ao processar atividade." });
            continue;
          }
          imported += 1;
          importedTripIds.add(String(trip.id));
          details.push({ athlete_id: connection.athlete_id, ride_with_gps_user_id: connection.ride_with_gps_user_id, trip_id: trip.id, outcome: "imported", reason: `Importada para a etapa de ${tripDate}.` });
        }
      } catch (error) {
        errors += 1;
        connectionErrorMessage = error instanceof Error ? error.message : "Falha ao sincronizar atleta.";
        details.push({ athlete_id: connection.athlete_id, ride_with_gps_user_id: connection.ride_with_gps_user_id, outcome: "error", reason: connectionErrorMessage });
      }
      const finishedAt = new Date().toISOString();
      await supabase.from("ride_with_gps_connections").update({
        status: connectionErrorMessage?.includes("expirada") ? "error" : "active",
        last_sync_at: finishedAt,
        last_success_at: connectionErrorMessage ? undefined : finishedAt,
        last_error: connectionErrorMessage,
        updated_at: finishedAt,
      }).eq("athlete_id", connection.athlete_id);
    }

    const summary = {
      status: errors ? "partial" : "succeeded",
      connections_scanned: connectionRows?.length ?? 0,
      trips_scanned: tripsScanned,
      activities_imported: imported,
      activities_skipped: skipped,
      errors_count: errors,
      details,
      finished_at: new Date().toISOString(),
    };
    const { error: finishError } = await supabase.from("activity_sync_runs").update(summary).eq("id", runId);
    if (finishError) throw finishError;
    return NextResponse.json({ ok: errors === 0, run_id: runId, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha na sincronização automática.";
    if (runId) {
      try {
        await createSupabaseAdmin().from("activity_sync_runs").update({ status: "failed", errors_count: 1, details: [{ outcome: "error", reason: message }], finished_at: new Date().toISOString() }).eq("id", runId);
      } catch {}
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
