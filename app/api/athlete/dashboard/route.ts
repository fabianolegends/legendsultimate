import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { registrationPaymentAllowsAccess } from "@/lib/registration-access";

function readAthlete(request: NextRequest) {
  const raw = request.cookies.get("strava_athlete")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as { id?: number; firstname?: string; lastname?: string; profile?: string }; } catch { return null; }
}

function isMissingWindfitColumn(error: any) {
  return error?.code === "42703" || String(error?.message ?? "").includes("payment_status");
}

export async function GET(request: NextRequest) {
  try {
    const athleteCookie = readAthlete(request);
    if (!athleteCookie?.id) return NextResponse.json({ error: "Sessão do atleta não encontrada." }, { status: 401 });

    const supabase = createSupabaseAdmin();
    const fullName = `${athleteCookie.firstname ?? ""} ${athleteCookie.lastname ?? ""}`.trim() || `Atleta Strava ${athleteCookie.id}`;
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .upsert({ strava_athlete_id: athleteCookie.id, full_name: fullName }, { onConflict: "strava_athlete_id" })
      .select("id, full_name, strava_athlete_id, category, country_code")
      .single();
    if (athleteError) throw athleteError;

    const { data: stageRows, error: stageError } = await supabase
      .from("stages")
      .select("id, event_id, name, route_label, stage_date, distance_km, elevation_m, stage_number, auto_validate_min_coverage, review_min_coverage, events(name), route_versions(id, version, file_name, is_active)")
      .order("stage_date", { ascending: true });
    if (stageError) throw stageError;

    const eventIds = [...new Set((stageRows ?? []).map((stage: any) => stage.event_id).filter(Boolean))];
    let registrationModuleReady = true;
    let windfitReady = true;
    let registrationRequired = false;
    let openTestMode = false;
    let registrations: any[] = [];

    if (eventIds.length) {
      const modernFields = "id, event_id, athlete_id, registration_code, bib_number, full_name, email, birth_date, gender, category, modality, country_code, city, status, claimed_at, source, external_registration_id, payment_status, last_synced_at";
      let result = await supabase
        .from("registrations")
        .select(modernFields)
        .in("event_id", eventIds)
        .eq("athlete_id", athlete.id)
        .order("created_at", { ascending: false });

      if (result.error && isMissingWindfitColumn(result.error)) {
        windfitReady = false;
        const fallback = await supabase
          .from("registrations")
          .select("id, event_id, athlete_id, registration_code, bib_number, full_name, email, birth_date, gender, category, modality, country_code, city, status, claimed_at")
          .in("event_id", eventIds)
          .eq("athlete_id", athlete.id)
          .order("created_at", { ascending: false });
        result = { data: (fallback.data ?? []).map((item: any) => ({ ...item, source: "manual", payment_status: "courtesy" })), error: fallback.error } as any;
      }

      if (result.error?.code === "42P01") {
        registrationModuleReady = false;
        openTestMode = true;
      } else if (result.error) {
        throw result.error;
      } else {
        registrations = result.data ?? [];
        const { count, error: countError } = await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .in("event_id", eventIds)
          .neq("status", "cancelled");
        if (countError) throw countError;
        const hasEligibleRegistration = registrations.some((item) => item.status === "confirmed" && registrationPaymentAllowsAccess(item.payment_status));
        registrationRequired = (count ?? 0) > 0 && !hasEligibleRegistration;
        openTestMode = (count ?? 0) === 0;
      }
    } else {
      openTestMode = true;
    }

    const eligibleRegistrations = registrations.filter((item) => item.status === "confirmed" && registrationPaymentAllowsAccess(item.payment_status));
    const eligibleEventIds = new Set(eligibleRegistrations.map((item) => item.event_id));
    const visibleStages = registrationRequired
      ? []
      : eligibleEventIds.size
        ? (stageRows ?? []).filter((stage: any) => eligibleEventIds.has(stage.event_id))
        : stageRows ?? [];

    const { data: activities, error: activityError } = await supabase
      .from("activities")
      .select("id, stage_id, source_activity_id, name, started_at, distance_km, elevation_m, moving_time_s, created_at")
      .eq("athlete_id", athlete.id)
      .order("created_at", { ascending: false });
    if (activityError) throw activityError;

    const activityIds = (activities ?? []).map((activity) => activity.id);
    let validations: any[] = [];
    if (activityIds.length) {
      const { data, error } = await supabase
        .from("validation_results")
        .select("id, activity_id, stage_id, status, coverage_percent, start_ok, finish_ok, direction_ok, checkpoints_passed, checkpoints_total, max_deviation_m, notes, validated_at, updated_at")
        .in("activity_id", activityIds);
      if (error) throw error;
      validations = data ?? [];
    }

    let timingConfigured = false;
    let passageRows: any[] = [];
    let segmentResultRows: any[] = [];
    let checkpointRows: any[] = [];
    let segmentRows: any[] = [];

    if (activityIds.length) {
      const { data: passages, error: passageError } = await supabase
        .from("checkpoint_passages")
        .select("id, activity_id, checkpoint_id, point_index, elapsed_s, activity_distance_m, nearest_distance_m, passed_at")
        .in("activity_id", activityIds)
        .order("elapsed_s", { ascending: true });

      if (!passageError) {
        timingConfigured = true;
        passageRows = passages ?? [];
        const checkpointIds = [...new Set(passageRows.map((passage) => passage.checkpoint_id))];
        if (checkpointIds.length) {
          const { data } = await supabase.from("checkpoints").select("id, stage_id, sequence, label, checkpoint_kind").in("id", checkpointIds);
          checkpointRows = data ?? [];
        }
        const { data: segmentResults } = await supabase
          .from("segment_results")
          .select("id, activity_id, segment_id, elapsed_s, status, created_at")
          .in("activity_id", activityIds)
          .order("elapsed_s", { ascending: true });
        segmentResultRows = segmentResults ?? [];
        const segmentIds = [...new Set(segmentResultRows.map((result) => result.segment_id))];
        if (segmentIds.length) {
          const { data } = await supabase.from("timed_segments").select("id, stage_id, name, segment_type, start_checkpoint_id, finish_checkpoint_id").in("id", segmentIds);
          segmentRows = data ?? [];
        }
      }
    }

    const validationByActivity = new Map(validations.map((item) => [item.activity_id, item]));
    const checkpointById = new Map(checkpointRows.map((item) => [item.id, item]));
    const segmentById = new Map(segmentRows.map((item) => [item.id, item]));
    const passagesByActivity = new Map<string, any[]>();
    for (const passage of passageRows) {
      const checkpoint = checkpointById.get(passage.checkpoint_id);
      const current = passagesByActivity.get(passage.activity_id) ?? [];
      current.push({ ...passage, checkpoint });
      passagesByActivity.set(passage.activity_id, current);
    }
    const segmentsByActivity = new Map<string, any[]>();
    for (const result of segmentResultRows) {
      const segment = segmentById.get(result.segment_id);
      const current = segmentsByActivity.get(result.activity_id) ?? [];
      current.push({ ...result, segment });
      segmentsByActivity.set(result.activity_id, current);
    }

    const submissions = (activities ?? []).map((activity) => ({
      ...activity,
      validation: validationByActivity.get(activity.id) ?? null,
      passages: passagesByActivity.get(activity.id) ?? [],
      segment_results: segmentsByActivity.get(activity.id) ?? [],
    }));
    const normalizedStages = (visibleStages ?? []).map((stage: any) => ({
      ...stage,
      event_name: Array.isArray(stage.events) ? stage.events[0]?.name : stage.events?.name,
      route_active: (stage.route_versions ?? []).some((route: any) => route.is_active),
    }));
    const confirmedRegistration = eligibleRegistrations[0] ?? null;

    return NextResponse.json({
      athlete: {
        ...athleteCookie,
        database_id: athlete.id,
        full_name: confirmedRegistration?.full_name ?? athlete.full_name,
        category: confirmedRegistration?.category ?? athlete.category,
        country_code: confirmedRegistration?.country_code ?? athlete.country_code,
        bib_number: confirmedRegistration?.bib_number ?? null,
        modality: confirmedRegistration?.modality ?? null,
      },
      registration: confirmedRegistration,
      registration_module_ready: registrationModuleReady,
      windfit_ready: windfitReady,
      registration_required: registrationRequired,
      open_test_mode: openTestMode,
      stages: normalizedStages,
      submissions,
      timing_configured: timingConfigured,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar o Passport." }, { status: 500 });
  }
}
