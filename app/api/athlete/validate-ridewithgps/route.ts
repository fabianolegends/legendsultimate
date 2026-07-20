import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { GeoPoint, validateActivity } from "@/lib/race-engine";
import { resolveRegistrationEligibility } from "@/lib/registration-access";
import {
  buildFallbackDistanceStream,
  calculateSegmentResults,
  detectCheckpointPassages,
  type TimedSegment,
  type TimingCheckpoint,
} from "@/lib/checkpoint-engine";
import { readRideWithGpsAccessToken, readRideWithGpsUser } from "@/lib/ridewithgps";

export const runtime = "nodejs";

type RideWithGpsTrackPoint = {
  x?: number;
  y?: number;
  d?: number;
  e?: number;
  t?: number;
};

type RideWithGpsTrip = {
  id: number;
  user_id?: number;
  name?: string;
  departed_at?: string | null;
  created_at?: string;
  distance?: number;
  elevation_gain?: number;
  moving_time?: number;
  duration?: number;
  avg_speed?: number;
  avg_hr?: number;
  avg_watts?: number;
  track_points?: RideWithGpsTrackPoint[];
};

function sampleMapPoints(points: GeoPoint[], maxPoints = 2500): Array<[number, number]> {
  if (points.length <= maxPoints) return points.map((point) => [point[0], point[1]]);
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => {
    const point = points[Math.round(index * step)];
    return [point[0], point[1]] as [number, number];
  });
}

function normalizedStream(values: number[], length: number, fallbackFinish: number) {
  if (values.length === length) return values.map((value) => Number(value));
  if (length <= 1) return [0];
  return Array.from({ length }, (_, index) => (index / (length - 1)) * fallbackFinish);
}

function cleanTrackPoints(points: RideWithGpsTrackPoint[]) {
  return points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

export async function POST(request: NextRequest) {
  const athleteCookie = readRideWithGpsUser(request);
  const accessToken = readRideWithGpsAccessToken(request);
  if (!athleteCookie?.id || !accessToken) {
    return NextResponse.json({ error: "Conecte novamente sua conta Ride with GPS." }, { status: 401 });
  }

  try {
    const body = await request.json() as { stageId?: string; tripId?: string; toleranceM?: number };
    const stageId = String(body.stageId ?? "").trim();
    const tripId = String(body.tripId ?? "").trim();
    const toleranceM = Number(body.toleranceM ?? 120);
    if (!stageId || !tripId) return NextResponse.json({ error: "Selecione uma etapa e uma atividade Ride with GPS." }, { status: 400 });

    const tripResponse = await fetch(`https://ridewithgps.com/api/v1/trips/${encodeURIComponent(tripId)}.json`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!tripResponse.ok) {
      return NextResponse.json({ error: "Não foi possível consultar esta atividade no Ride with GPS." }, { status: tripResponse.status });
    }
    const tripPayload = (await tripResponse.json()) as { trip?: RideWithGpsTrip };
    const trip = tripPayload.trip;
    if (!trip?.id) return NextResponse.json({ error: "Atividade Ride with GPS inválida." }, { status: 422 });
    if (trip.user_id && trip.user_id !== athleteCookie.id) {
      return NextResponse.json({ error: "Esta atividade não pertence à conta conectada." }, { status: 403 });
    }

    const trackPoints = cleanTrackPoints(trip.track_points ?? []);
    if (trackPoints.length < 2) return NextResponse.json({ error: "Esta atividade não possui pontos GPS disponíveis." }, { status: 422 });

    const activityPoints: GeoPoint[] = trackPoints.map((point) => [Number(point.y), Number(point.x), Number.isFinite(point.e) ? Number(point.e) : null]);
    const timestamps = trackPoints.map((point) => Number(point.t)).filter(Number.isFinite);
    const firstTimestamp = timestamps[0] ?? null;
    const elapsedSeconds = timestamps.length === activityPoints.length && firstTimestamp !== null
      ? timestamps.map((value) => Math.max(0, value - firstTimestamp))
      : normalizedStream([], activityPoints.length, Number(trip.duration ?? trip.moving_time ?? 0));
    const distanceValues = trackPoints.map((point) => Number(point.d));
    const distanceStream = distanceValues.length === activityPoints.length && distanceValues.every(Number.isFinite)
      ? distanceValues
      : buildFallbackDistanceStream(activityPoints);
    const startedAt = trip.departed_at ?? trip.created_at ?? new Date().toISOString();

    const supabase = createSupabaseAdmin();
    const { data: stage, error: stageError } = await supabase.from("stages").select("id, event_id").eq("id", stageId).single();
    if (stageError || !stage) return NextResponse.json({ error: stageError?.message ?? "Etapa não encontrada." }, { status: 404 });

    const { data: route, error: routeError } = await supabase
      .from("route_versions")
      .select("id, version, file_name, distance_km, elevation_m, route_points")
      .eq("stage_id", stageId)
      .eq("is_active", true)
      .single();
    if (routeError || !route) return NextResponse.json({ error: routeError?.message ?? "A etapa não possui rota oficial ativa." }, { status: 404 });
    const officialPoints = (route.route_points ?? []) as GeoPoint[];
    if (officialPoints.length < 2) return NextResponse.json({ error: "A versão oficial não possui pontos válidos." }, { status: 422 });

    const { data: checkpoints, error: checkpointError } = await supabase
      .from("checkpoints")
      .select("*")
      .eq("stage_id", stageId)
      .order("sequence", { ascending: true });
    if (checkpointError) throw checkpointError;

    const report = validateActivity({
      officialPoints,
      activityPoints,
      checkpoints: (checkpoints ?? []) as TimingCheckpoint[],
      toleranceM: Number.isFinite(toleranceM) ? Math.min(300, Math.max(40, toleranceM)) : 120,
    });

    const fullName = athleteCookie.name?.trim() || `Atleta Ride with GPS ${athleteCookie.id}`;
    const { data: athleteRow, error: athleteError } = await supabase
      .from("athletes")
      .upsert({ ride_with_gps_user_id: athleteCookie.id, full_name: fullName, email: athleteCookie.email ?? null }, { onConflict: "ride_with_gps_user_id" })
      .select("id")
      .single();
    if (athleteError) throw athleteError;

    const eligibility = await resolveRegistrationEligibility(supabase, { eventId: stage.event_id, athleteId: athleteRow.id });
    if (eligibility.required && !eligibility.eligible) {
      return NextResponse.json({
        error: "Sua conta Ride with GPS ainda não está vinculada a uma inscrição confirmada para este evento. Use o código recebido na inscrição.",
        code: "REGISTRATION_REQUIRED",
      }, { status: 403 });
    }
    const registration = eligibility.registration;
    if (registration) {
      const { error } = await supabase.from("athletes").update({
        full_name: registration.full_name,
        email: registration.email,
        category: registration.category,
        country_code: registration.country_code,
        bib_number: registration.bib_number,
        birth_date: registration.birth_date,
        gender: registration.gender,
        modality: registration.modality,
        updated_at: new Date().toISOString(),
      }).eq("id", athleteRow.id);
      if (error) throw error;
    }

    const { data: activityRow, error: activityError } = await supabase
      .from("activities")
      .upsert({
        athlete_id: athleteRow.id,
        stage_id: stageId,
        source: "ride_with_gps",
        source_activity_id: String(trip.id),
        name: trip.name || "Atividade Ride with GPS",
        started_at: startedAt,
        distance_km: Number((Number(trip.distance ?? 0) / 1000).toFixed(3)),
        elevation_m: Math.round(Number(trip.elevation_gain ?? 0)),
        moving_time_s: Math.round(Number(trip.moving_time ?? trip.duration ?? 0)),
        avg_speed_kmh: Number.isFinite(trip.avg_speed) ? Number(trip.avg_speed) : null,
        avg_heart_rate: trip.avg_hr ?? null,
        avg_watts: trip.avg_watts ?? null,
        gps_points: activityPoints,
        raw_payload: trip,
      }, { onConflict: "source,source_activity_id" })
      .select("id")
      .single();
    if (activityError) throw activityError;

    const status = report.status === "manual_review" ? "review" : report.status;
    const { data: validation, error: validationError } = await supabase
      .from("validation_results")
      .upsert({
        activity_id: activityRow.id,
        stage_id: stageId,
        status,
        coverage_percent: report.coverage_percent,
        start_ok: report.start_ok,
        finish_ok: report.finish_ok,
        direction_ok: report.direction_ok,
        checkpoints_passed: report.checkpoints_hit,
        checkpoints_total: report.checkpoints_total,
        max_deviation_m: report.max_deviation_m,
        notes: report.notes.join("\n"),
        validated_at: new Date().toISOString(),
      }, { onConflict: "activity_id" })
      .select("id,status")
      .single();
    if (validationError) throw validationError;

    const passageDetections = detectCheckpointPassages({
      activityPoints,
      elapsedSeconds,
      activityDistanceMeters: distanceStream,
      startedAt,
      checkpoints: (checkpoints ?? []) as TimingCheckpoint[],
    });

    let timingConfigured = false;
    let timingMessage: string | null = null;
    let segmentDetections = [] as ReturnType<typeof calculateSegmentResults>;
    const { data: segmentRows, error: segmentQueryError } = await supabase
      .from("timed_segments")
      .select("id, name, segment_type, start_checkpoint_id, finish_checkpoint_id")
      .eq("stage_id", stageId)
      .eq("is_active", true);

    if (!segmentQueryError) {
      timingConfigured = true;
      segmentDetections = calculateSegmentResults((segmentRows ?? []) as TimedSegment[], passageDetections);
      const { error: passageDeleteError } = await supabase.from("checkpoint_passages").delete().eq("activity_id", activityRow.id);
      if (passageDeleteError) throw passageDeleteError;
      const passed = passageDetections.filter((passage) => passage.passed && passage.point_index !== null && passage.elapsed_s !== null && passage.passed_at);
      let savedPassages: Array<{ id: string; checkpoint_id: string }> = [];
      if (passed.length) {
        const { data, error } = await supabase.from("checkpoint_passages").insert(passed.map((passage) => ({
          activity_id: activityRow.id,
          checkpoint_id: passage.checkpoint_id,
          point_index: passage.point_index,
          elapsed_s: passage.elapsed_s,
          activity_distance_m: passage.activity_distance_m,
          nearest_distance_m: passage.nearest_distance_m,
          passed_at: passage.passed_at,
        }))).select("id, checkpoint_id");
        if (error) throw error;
        savedPassages = data ?? [];
      }
      const passageIdByCheckpoint = new Map(savedPassages.map((passage) => [passage.checkpoint_id, passage.id]));
      const completedSegments = segmentDetections.filter((segment) => segment.completed && segment.elapsed_s !== null);
      if (completedSegments.length) {
        const { error } = await supabase.from("segment_results").insert(completedSegments.map((segment) => ({
          activity_id: activityRow.id,
          segment_id: segment.segment_id,
          start_passage_id: passageIdByCheckpoint.get(segment.start_checkpoint_id),
          finish_passage_id: passageIdByCheckpoint.get(segment.finish_checkpoint_id),
          elapsed_s: segment.elapsed_s,
          status: status === "validated" ? "valid" : "review",
        })));
        if (error) throw error;
      }
    } else {
      timingMessage = "Cronometragem de checkpoints aguardando a migration 005 no Supabase.";
    }

    const passageByCheckpoint = new Map(passageDetections.map((passage) => [passage.checkpoint_id, passage]));
    return NextResponse.json({
      report,
      validation,
      registration,
      route: { id: route.id, version: route.version, file_name: route.file_name, distance_km: route.distance_km, elevation_m: route.elevation_m },
      activity: {
        id: String(trip.id), database_id: activityRow.id, name: trip.name || "Atividade Ride with GPS", file_name: trip.name || "Atividade Ride with GPS",
        source: "Ride with GPS", start_date: startedAt, start_date_local: startedAt,
        distance_km: Number((Number(trip.distance ?? 0) / 1000).toFixed(2)), elevation_m: Math.round(Number(trip.elevation_gain ?? 0)),
        moving_time_min: Math.round(Number(trip.moving_time ?? trip.duration ?? 0) / 60), points_count: activityPoints.length,
      },
      map: {
        official_points: sampleMapPoints(officialPoints),
        activity_points: sampleMapPoints(activityPoints),
        checkpoints: report.checkpoint_results.map((checkpoint) => ({
          sequence: checkpoint.sequence, label: checkpoint.label, latitude: checkpoint.latitude, longitude: checkpoint.longitude,
          hit: checkpoint.hit, nearest_distance_m: checkpoint.nearest_distance_m,
          passed_at: checkpoint.id ? passageByCheckpoint.get(checkpoint.id)?.passed_at ?? null : null,
          elapsed_s: checkpoint.id ? passageByCheckpoint.get(checkpoint.id)?.elapsed_s ?? null : null,
        })),
      },
      timing: { configured: timingConfigured, message: timingMessage, passages: passageDetections, segments: segmentDetections },
      saved: true,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao validar a atividade." }, { status: 500 });
  }
}
