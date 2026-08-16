import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { registrationPaymentAllowsAccess } from "@/lib/registration-access";
import { readRideWithGpsUser } from "@/lib/ridewithgps";
import { buildOverallClassification } from "@/lib/classification-engine";

function readAthlete(request: NextRequest) {
  return readRideWithGpsUser(request);
}

function isMissingWindfitColumn(error: any) {
  return error?.code === "42703" || String(error?.message ?? "").includes("payment_status");
}

export async function GET(request: NextRequest) {
  try {
    const athleteCookie = readAthlete(request);
    if (!athleteCookie?.id) return NextResponse.json({ error: "Sessão do atleta não encontrada." }, { status: 401 });

    const supabase = createSupabaseAdmin();
    const fullName = athleteCookie.name?.trim() || `Atleta Ride with GPS ${athleteCookie.id}`;
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .upsert({ ride_with_gps_user_id: athleteCookie.id, full_name: fullName }, { onConflict: "ride_with_gps_user_id" })
      .select("id, full_name, ride_with_gps_user_id, category, country_code")
      .single();
    if (athleteError) throw athleteError;

    const { data: eventRows, error: eventError } = await supabase
      .from("events")
      .select("id, slug, name, status, starts_on, ends_on, location")
      .neq("status", "archived")
      .order("starts_on", { ascending: false });
    if (eventError) throw eventError;

    const { data: stageRows, error: stageError } = await supabase
      .from("stages")
      .select("id, event_id, name, route_label, stage_date, distance_km, elevation_m, stage_number, auto_validate_min_coverage, review_min_coverage, results_published, events(name), route_versions(id, version, file_name, is_active)")
      .order("stage_date", { ascending: true });
    if (stageError) throw stageError;

    const eventIds = (eventRows ?? []).map((event) => event.id);
    const certificateByEvent = new Map<string, any>();
    if (eventIds.length) {
      const { data: certificateRows } = await supabase
        .from("events")
        .select("id, certificate_enabled, certificate_template_path, certificate_text_color")
        .in("id", eventIds);
      for (const item of certificateRows ?? []) certificateByEvent.set(item.id, item);
    }
    let registrationModuleReady = true;
    let windfitReady = true;
    let registrationRequired = false;
    let openTestMode = false;
    let registrations: any[] = [];

    if (eventIds.length) {
      const modernFields = "id, event_id, athlete_id, registration_code, bib_number, full_name, email, birth_date, gender, category, modality, journey_format, country_code, city, status, claimed_at, source, external_registration_id, payment_status, last_synced_at";
      let result = await supabase
        .from("registrations")
        .select(modernFields)
        .eq("athlete_id", athlete.id)
        .order("created_at", { ascending: false });

      if (result.error && isMissingWindfitColumn(result.error)) {
        windfitReady = false;
        const fallback = await supabase
          .from("registrations")
          .select("id, event_id, athlete_id, registration_code, bib_number, full_name, email, birth_date, gender, category, modality, country_code, city, status, claimed_at")
          .eq("athlete_id", athlete.id)
          .order("created_at", { ascending: false });
        result = { data: (fallback.data ?? []).map((item: any) => ({ ...item, journey_format: "ultimate", source: "manual", payment_status: "courtesy" })), error: fallback.error } as any;
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
    const hasUltimateRegistration = eligibleRegistrations.some((item) => (item.journey_format ?? "ultimate") === "ultimate");
    const visibleStages = registrationRequired
      ? []
      : eligibleEventIds.size
        ? (stageRows ?? []).filter((stage: any) => eligibleEventIds.has(stage.event_id) && (hasUltimateRegistration || Number(stage.stage_number) >= 3))
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
    const eventById = new Map((eventRows ?? []).map((event) => [event.id, event]));
    const certificateResultByIdentity = new Map<string, any>();
    if (eventIds.length && certificateByEvent.size) {
      const { data: officialResults } = await supabase
        .from("stage_results")
        .select("event_id, stage_id, athlete_id, registration_id, full_name, bib_number, category, journey_format, final_time_s, position, weighted_points, status")
        .in("event_id", eventIds)
        .in("status", ["official", "disqualified", "dnf"]);
      for (const eventId of eventIds) {
        const eventStages = normalizedStages.filter((stage: any) => stage.event_id === eventId);
        const publishedStages = eventStages.filter((stage: any) => stage.results_published === true);
        if (!publishedStages.length) continue;
        const stageById = new Map(publishedStages.map((stage: any) => [stage.id, stage]));
        const source = (officialResults ?? []).filter((item: any) => item.event_id === eventId && stageById.has(item.stage_id));
        const overall = buildOverallClassification(source.map((item: any) => ({
          athlete_id: item.athlete_id, registration_id: item.registration_id, full_name: item.full_name,
          bib_number: item.bib_number, category: item.category, journey_format: item.journey_format ?? "ultimate", stage_id: item.stage_id,
          stage_number: Number((stageById.get(item.stage_id) as any)?.stage_number ?? 0), position: item.position,
          final_time_s: Number(item.final_time_s), weighted_points: Number(item.weighted_points), status: item.status,
        })), eventStages.length, { ultimate: [1, 2, 3, 4], short: [3, 4] });
        for (const item of overall) {
          const value = { ...item, total_time_s: item.stage_results.reduce((total, result) => total + Number(result.final_time_s), 0) };
          certificateResultByIdentity.set(`${eventId}:${item.registration_id || item.athlete_id}`, value);
          certificateResultByIdentity.set(`${eventId}:${item.athlete_id}:${item.journey_format}`, value);
        }
      }
    }
    const normalizedRegistrations = eligibleRegistrations.map((registration) => {
      const event = eventById.get(registration.event_id) ?? null;
      const config = certificateByEvent.get(registration.event_id);
      const classification = certificateResultByIdentity.get(`${registration.event_id}:${registration.id}`)
        ?? certificateResultByIdentity.get(`${registration.event_id}:${registration.athlete_id}:${registration.journey_format ?? "ultimate"}`);
      const templateUrl = config?.certificate_template_path
        ? supabase.storage.from("certificate-templates").getPublicUrl(config.certificate_template_path).data.publicUrl
        : null;
      return {
        ...registration,
        event,
        stage_count: normalizedStages.filter((stage: any) => stage.event_id === registration.event_id && ((registration.journey_format ?? "ultimate") === "ultimate" || Number(stage.stage_number) >= 3)).length,
        certificate: {
          enabled: config?.certificate_enabled === true && Boolean(templateUrl),
          available: config?.certificate_enabled === true && Boolean(templateUrl) && classification?.eligible_for_title === true,
          template_url: templateUrl,
          text_color: config?.certificate_text_color || "#171a16",
          total_time_s: classification?.total_time_s ?? null,
          total_points: classification?.total_points ?? null,
          category_position: classification?.overall_position ?? null,
          issued_at: classification ? new Date().toISOString() : null,
        },
      };
    });
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
      registrations: normalizedRegistrations,
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
