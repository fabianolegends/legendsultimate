import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { GeoPoint, parseGpx, polylineDistanceKm, validateActivity } from "@/lib/race-engine";
import { isAdminRequest } from "@/lib/admin-auth";

function sampleMapPoints(points: GeoPoint[], maxPoints = 2500): Array<[number, number]> {
  if (points.length <= maxPoints) return points.map((point) => [point[0], point[1]]);
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => {
    const point = points[Math.round(index * step)];
    return [point[0], point[1]] as [number, number];
  });
}

function gpxTimeRange(xml: string) {
  const values = [...xml.matchAll(/<time>([^<]+)<\/time>/gi)]
    .map((match) => new Date(match[1]).getTime()).filter(Number.isFinite).sort((a, b) => a - b);
  return values.length ? { startedAt: new Date(values[0]).toISOString(), movingTimeS: Math.max(0, Math.round((values.at(-1)! - values[0]) / 1000)) } : null;
}

function elevationGain(points: GeoPoint[]) {
  let gain = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1][2]; const current = points[index][2];
    if (previous !== null && current !== null && current > previous) gain += current - previous;
  }
  return Math.round(gain);
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const stageId = String(formData.get("stageId") ?? "");
    const registrationId = String(formData.get("registrationId") ?? "");
    const file = formData.get("file");
    const toleranceM = Number(formData.get("toleranceM") ?? 120);

    if (!stageId || !registrationId || !(file instanceof File)) {
      return NextResponse.json({ error: "Selecione a etapa, o atleta e envie o GPX da atividade." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      return NextResponse.json({ error: "O arquivo da atividade precisa estar no formato GPX." }, { status: 400 });
    }

    const gpxText = await file.text();
    const activityPoints = parseGpx(gpxText);
    const supabase = createSupabaseAdmin();
    let { data: stage, error: stageError } = await supabase
      .from("stages")
      .select("id, event_id, stage_date, direction_required, start_radius_m, finish_radius_m, auto_validate_min_coverage, review_min_coverage, route_tolerance_m, auto_validate_max_off_route_percent, review_max_off_route_percent, max_continuous_off_route_km, auto_validate_min_checkpoint_ratio, review_min_checkpoint_ratio")
      .eq("id", stageId)
      .single();
    if (stageError?.code === "42703") {
      const legacy = await supabase.from("stages").select("id, event_id, stage_date, direction_required, start_radius_m, finish_radius_m, auto_validate_min_coverage, review_min_coverage").eq("id", stageId).single();
      stage = legacy.data as typeof stage;
      stageError = legacy.error;
    }
    if (stageError || !stage) return NextResponse.json({ error: stageError?.message ?? "Etapa não encontrada." }, { status: 404 });
    const { data: registration, error: registrationError } = await supabase.from("registrations")
      .select("id, event_id, athlete_id, full_name, email, birth_date, gender, category, modality, country_code, bib_number, status, payment_status")
      .eq("id", registrationId).eq("event_id", stage.event_id).maybeSingle();
    if (registrationError) throw registrationError;
    if (!registration || registration.status !== "confirmed" || !["paid", "courtesy"].includes(registration.payment_status)) {
      return NextResponse.json({ error: "Selecione um atleta confirmado e elegível deste evento." }, { status: 403 });
    }
    const { data: route, error: routeError } = await supabase
      .from("route_versions")
      .select("id, version, file_name, distance_km, elevation_m, route_points")
      .eq("stage_id", stageId)
      .eq("is_active", true)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: routeError?.message ?? "A etapa não possui uma rota oficial ativa." },
        { status: 404 },
      );
    }

    const officialPoints = (route.route_points ?? []) as GeoPoint[];
    if (officialPoints.length < 2) {
      return NextResponse.json({ error: "A versão oficial não possui pontos de rota válidos." }, { status: 422 });
    }

    const { data: checkpoints, error: checkpointError } = await supabase
      .from("checkpoints")
      .select("id, sequence, label, latitude, longitude, radius_m")
      .eq("stage_id", stageId)
      .order("sequence", { ascending: true });
    if (checkpointError) throw checkpointError;

    const report = validateActivity({
      officialPoints,
      activityPoints,
      checkpoints: checkpoints ?? [],
      toleranceM: Number.isFinite(toleranceM) ? Math.min(300, Math.max(40, toleranceM)) : 120,
      rules: {
        routeToleranceM: Number(stage.route_tolerance_m ?? toleranceM ?? 120),
        startRadiusM: Number(stage.start_radius_m ?? 180),
        finishRadiusM: Number(stage.finish_radius_m ?? 180),
        directionRequired: stage.direction_required !== false,
        autoValidateMinCoverage: Number(stage.auto_validate_min_coverage ?? 95),
        reviewMinCoverage: Number(stage.review_min_coverage ?? 80),
        autoValidateMaxOffRoutePercent: Number(stage.auto_validate_max_off_route_percent ?? 5),
        reviewMaxOffRoutePercent: Number(stage.review_max_off_route_percent ?? 20),
        maxContinuousOffRouteKm: Number(stage.max_continuous_off_route_km ?? 1.5),
        autoValidateMinCheckpointRatio: Number(stage.auto_validate_min_checkpoint_ratio ?? .95),
        reviewMinCheckpointRatio: Number(stage.review_min_checkpoint_ratio ?? .8),
      },
    });

    let athleteId = registration.athlete_id as string | null;
    if (!athleteId) {
      const { data: knownAthletes, error: knownAthleteError } = await supabase.from("athletes").select("id").eq("email", registration.email).order("created_at", { ascending: true }).limit(1);
      if (knownAthleteError) throw knownAthleteError;
      athleteId = knownAthletes?.[0]?.id ?? null;
      if (!athleteId) {
        const { data: athlete, error: athleteError } = await supabase.from("athletes").insert({
          full_name: registration.full_name, email: registration.email, birth_date: registration.birth_date,
          gender: registration.gender, category: registration.category, modality: registration.modality,
          country_code: registration.country_code, bib_number: registration.bib_number,
        }).select("id").single();
        if (athleteError) throw athleteError;
        athleteId = athlete.id;
      }
      const { error: linkError } = await supabase.from("registrations").update({ athlete_id: athleteId, updated_at: new Date().toISOString() }).eq("id", registration.id);
      if (linkError) throw linkError;
    }

    const timeRange = gpxTimeRange(gpxText);
    const sourceActivityId = `admin:${stageId}:${registration.id}:${createHash("sha256").update(gpxText).digest("hex").slice(0, 20)}`;
    const { data: activity, error: activityError } = await supabase.from("activities").upsert({
      athlete_id: athleteId, stage_id: stageId, source: "gpx", source_activity_id: sourceActivityId,
      name: file.name.replace(/\.gpx$/i, "") || "GPX recebido pela organização",
      started_at: timeRange?.startedAt ?? `${stage.stage_date}T12:00:00-03:00`,
      distance_km: Number(polylineDistanceKm(activityPoints).toFixed(3)), elevation_m: elevationGain(activityPoints),
      moving_time_s: timeRange?.movingTimeS || null, gps_points: activityPoints,
      raw_payload: { file_name: file.name, uploaded_by: "organizer", registration_id: registration.id },
    }, { onConflict: "source,source_activity_id" }).select("id").single();
    if (activityError) throw activityError;

    const validationStatus = report.status === "manual_review" ? "review" : report.status;
    const { error: validationError } = await supabase.from("validation_results").upsert({
      activity_id: activity.id, stage_id: stageId, status: validationStatus,
      coverage_percent: report.coverage_percent, start_ok: report.start_ok, finish_ok: report.finish_ok,
      direction_ok: report.direction_ok, checkpoints_passed: report.checkpoints_hit,
      checkpoints_total: report.checkpoints_total, max_deviation_m: report.max_deviation_m,
      notes: report.notes.join("\n"), validated_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: "activity_id" });
    if (validationError) throw validationError;

    return NextResponse.json({
      report,
      route: {
        id: route.id,
        version: route.version,
        file_name: route.file_name,
        distance_km: route.distance_km,
        elevation_m: route.elevation_m,
      },
      activity: { database_id: activity.id, file_name: file.name, points_count: activityPoints.length,
        distance_km: Number(polylineDistanceKm(activityPoints).toFixed(3)), elevation_m: elevationGain(activityPoints),
        moving_time_min: timeRange?.movingTimeS ? Number((timeRange.movingTimeS / 60).toFixed(1)) : null },
      athlete: { registration_id: registration.id, full_name: registration.full_name, bib_number: registration.bib_number },
      saved: true,
      map: {
        official_points: sampleMapPoints(officialPoints),
        activity_points: sampleMapPoints(activityPoints),
        checkpoints: report.checkpoint_results.map((checkpoint) => ({
          sequence: checkpoint.sequence,
          label: checkpoint.label,
          latitude: checkpoint.latitude,
          longitude: checkpoint.longitude,
          hit: checkpoint.hit,
          nearest_distance_m: checkpoint.nearest_distance_m,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao validar a atividade.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
