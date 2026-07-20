import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";
import type { GeoPoint } from "@/lib/race-engine";
import {
  buildFallbackDistanceStream,
  calculateSegmentResults,
  detectCheckpointPassages,
  type TimedSegment,
  type TimingCheckpoint,
} from "@/lib/checkpoint-engine";

function unauthorized() {
  return NextResponse.json(
    { error: "Sessão administrativa inválida ou expirada." },
    { status: 401 },
  );
}

function migrationRequired(error?: { code?: string; message?: string } | null) {
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    Boolean(error?.message?.includes("timed_segments"))
  );
}

function pointAtProgress(points: GeoPoint[], progress: number) {
  const normalized = Math.min(100, Math.max(0, progress));
  const index = Math.round((normalized / 100) * Math.max(0, points.length - 1));
  const point = points[index] ?? points[0];
  return { latitude: point?.[0], longitude: point?.[1] };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const stageId = request.nextUrl.searchParams.get("stageId")?.trim();
  if (!stageId)
    return NextResponse.json(
      { error: "Selecione uma etapa." },
      { status: 400 },
    );

  try {
    const supabase = createSupabaseAdmin();
    const [
      { data: stage, error: stageError },
      { data: route, error: routeError },
      { data: checkpoints, error: checkpointError },
    ] = await Promise.all([
      supabase
        .from("stages")
        .select("id, name, route_label, stage_date, distance_km, elevation_m")
        .eq("id", stageId)
        .single(),
      supabase
        .from("route_versions")
        .select("id, version, file_name, route_points")
        .eq("stage_id", stageId)
        .eq("is_active", true)
        .single(),
      supabase
        .from("checkpoints")
        .select("*")
        .eq("stage_id", stageId)
        .order("sequence", { ascending: true }),
    ]);
    if (stageError || !stage)
      return NextResponse.json(
        { error: stageError?.message ?? "Etapa não encontrada." },
        { status: 404 },
      );
    if (routeError || !route)
      return NextResponse.json(
        { error: routeError?.message ?? "A etapa não possui rota ativa." },
        { status: 404 },
      );
    if (checkpointError) throw checkpointError;

    const { data: segments, error: segmentError } = await supabase
      .from("timed_segments")
      .select(
        "id, stage_id, name, segment_type, start_checkpoint_id, finish_checkpoint_id, is_active, created_at",
      )
      .eq("stage_id", stageId)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      module_ready: !segmentError,
      migration_required: migrationRequired(segmentError),
      stage,
      route: { ...route, route_points: route.route_points ?? [] },
      checkpoints: checkpoints ?? [],
      segments: segmentError ? [] : (segments ?? []),
      module_message: segmentError
        ? "Execute a migration 005_checkpoint_segment_engine.sql no Supabase para habilitar segmentos e cronometragem."
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao carregar checkpoints.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = (await request.json()) as {
      stageId?: string;
      checkpoints?: Array<{
        sequence?: number;
        label?: string;
        route_progress?: number;
        radius_m?: number;
      }>;
    };
    const stageId = String(body.stageId ?? "").trim();
    const definitions = Array.isArray(body.checkpoints) ? body.checkpoints : [];
    if (!stageId || definitions.length < 3) {
      return NextResponse.json(
        {
          error:
            "A etapa precisa ter largada, ao menos um checkpoint e chegada.",
        },
        { status: 400 },
      );
    }
    if (definitions.length > 14)
      return NextResponse.json(
        { error: "O limite é de 12 checkpoints intermediários." },
        { status: 400 },
      );

    const supabase = createSupabaseAdmin();
    const { data: route, error: routeError } = await supabase
      .from("route_versions")
      .select("route_points")
      .eq("stage_id", stageId)
      .eq("is_active", true)
      .single();
    if (routeError || !route)
      return NextResponse.json(
        { error: routeError?.message ?? "Rota ativa não encontrada." },
        { status: 404 },
      );
    const routePoints = (route.route_points ?? []) as GeoPoint[];
    if (routePoints.length < 2)
      return NextResponse.json(
        { error: "A rota ativa não possui pontos suficientes." },
        { status: 422 },
      );

    const normalized = definitions
      .map((definition, index) => {
        const isStart = index === 0;
        const isFinish = index === definitions.length - 1;
        const routeProgress = isStart
          ? 0
          : isFinish
            ? 100
            : Math.min(
                99.99,
                Math.max(0.01, Number(definition.route_progress ?? 0)),
              );
        const coordinate = pointAtProgress(routePoints, routeProgress);
        return {
          stage_id: stageId,
          sequence: index,
          label:
            String(
              definition.label ??
                (isStart ? "Largada" : isFinish ? "Chegada" : `CP ${index}`),
            ).trim() || `CP ${index}`,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          radius_m: Math.min(
            500,
            Math.max(30, Math.round(Number(definition.radius_m ?? 120))),
          ),
          route_progress: Number(routeProgress.toFixed(2)),
          checkpoint_kind: isStart ? "start" : isFinish ? "finish" : "control",
          is_timing_point: true,
        };
      })
      .sort((a, b) => a.route_progress - b.route_progress)
      .map((checkpoint, index, all) => ({
        ...checkpoint,
        sequence: index,
        label:
          index === 0
            ? "Largada"
            : index === all.length - 1
              ? "Chegada"
              : checkpoint.label,
        checkpoint_kind:
          index === 0
            ? "start"
            : index === all.length - 1
              ? "finish"
              : "control",
      }));

    const { data: existing, error: existingError } = await supabase
      .from("checkpoints")
      .select("id, sequence")
      .eq("stage_id", stageId);
    if (existingError) throw existingError;
    const existingBySequence = new Map(
      (existing ?? []).map((checkpoint) => [
        checkpoint.sequence,
        checkpoint.id,
      ]),
    );
    const keptIds: string[] = [];

    for (const checkpoint of normalized) {
      const existingId = existingBySequence.get(checkpoint.sequence);
      if (existingId) {
        const { error } = await supabase
          .from("checkpoints")
          .update(checkpoint)
          .eq("id", existingId);
        if (error) {
          if (migrationRequired(error))
            return NextResponse.json(
              {
                error:
                  "Execute a migration 005_checkpoint_segment_engine.sql antes de salvar.",
              },
              { status: 409 },
            );
          throw error;
        }
        keptIds.push(existingId);
      } else {
        const { data, error } = await supabase
          .from("checkpoints")
          .insert(checkpoint)
          .select("id")
          .single();
        if (error) {
          if (migrationRequired(error))
            return NextResponse.json(
              {
                error:
                  "Execute a migration 005_checkpoint_segment_engine.sql antes de salvar.",
              },
              { status: 409 },
            );
          throw error;
        }
        keptIds.push(data.id);
      }
    }

    const obsoleteIds = (existing ?? [])
      .filter((checkpoint) => !keptIds.includes(checkpoint.id))
      .map((checkpoint) => checkpoint.id);
    if (obsoleteIds.length) {
      const { error } = await supabase
        .from("checkpoints")
        .delete()
        .in("id", obsoleteIds);
      if (error) throw error;
    }

    const { data: saved, error: savedError } = await supabase
      .from("checkpoints")
      .select("*")
      .eq("stage_id", stageId)
      .order("sequence", { ascending: true });
    if (savedError) throw savedError;
    return NextResponse.json({ saved: true, checkpoints: saved ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao salvar checkpoints.",
      },
      { status: 500 },
    );
  }
}

function normalizedElapsedStream(pointCount: number, durationS: number) {
  if (pointCount <= 1) return [0];
  const safeDuration = Math.max(0, Number(durationS) || 0);
  return Array.from(
    { length: pointCount },
    (_, index) => (index / (pointCount - 1)) * safeDuration,
  );
}

function timingForActivity(activity: any, points: GeoPoint[]) {
  const storedElapsed = activity.raw_payload?.timing_stream?.elapsed_seconds;
  const storedDistances = activity.raw_payload?.timing_stream?.distance_meters;
  if (
    Array.isArray(storedElapsed) &&
    storedElapsed.length === points.length &&
    storedElapsed.every(Number.isFinite)
  ) {
    return {
      elapsedSeconds: storedElapsed.map(Number),
      distanceMeters:
        Array.isArray(storedDistances) &&
        storedDistances.length === points.length &&
        storedDistances.every(Number.isFinite)
          ? storedDistances.map(Number)
          : buildFallbackDistanceStream(points),
      precise: true,
    };
  }

  const trackPoints = Array.isArray(activity.raw_payload?.track_points)
    ? activity.raw_payload.track_points.filter(
        (point: any) =>
          Number.isFinite(Number(point?.x)) &&
          Number.isFinite(Number(point?.y)),
      )
    : [];
  const timestamps = trackPoints.map((point: any) => Number(point.t));
  if (
    trackPoints.length === points.length &&
    timestamps.length === points.length &&
    timestamps.every(Number.isFinite)
  ) {
    const first = timestamps[0];
    const distances = trackPoints.map((point: any) => Number(point.d));
    return {
      elapsedSeconds: timestamps.map((value: number) =>
        Math.max(0, value - first),
      ),
      distanceMeters: distances.every(Number.isFinite)
        ? distances
        : buildFallbackDistanceStream(points),
      precise: true,
    };
  }

  return {
    elapsedSeconds: normalizedElapsedStream(
      points.length,
      Number(activity.moving_time_s ?? 0),
    ),
    distanceMeters: buildFallbackDistanceStream(points),
    precise: false,
  };
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = (await request.json()) as { stageId?: string };
    const stageId = String(body.stageId ?? "").trim();
    if (!stageId)
      return NextResponse.json(
        { error: "Selecione uma etapa." },
        { status: 400 },
      );

    const supabase = createSupabaseAdmin();
    const [stageQuery, checkpointQuery, segmentQuery, activityQuery] =
      await Promise.all([
        supabase
          .from("stages")
          .select("id, results_locked")
          .eq("id", stageId)
          .single(),
        supabase
          .from("checkpoints")
          .select(
            "id, sequence, label, latitude, longitude, radius_m, checkpoint_kind",
          )
          .eq("stage_id", stageId)
          .order("sequence", { ascending: true }),
        supabase
          .from("timed_segments")
          .select(
            "id, name, segment_type, start_checkpoint_id, finish_checkpoint_id",
          )
          .eq("stage_id", stageId)
          .eq("is_active", true),
        supabase
          .from("activities")
          .select("id, started_at, moving_time_s, gps_points, raw_payload")
          .eq("stage_id", stageId),
      ]);
    if (stageQuery.error || !stageQuery.data)
      return NextResponse.json(
        { error: stageQuery.error?.message ?? "Etapa não encontrada." },
        { status: 404 },
      );
    if (stageQuery.data.results_locked)
      return NextResponse.json(
        {
          error:
            "A etapa está publicada e bloqueada. Reabra a apuração antes de recalcular as passagens.",
        },
        { status: 423 },
      );
    if (checkpointQuery.error) throw checkpointQuery.error;
    if (segmentQuery.error) throw segmentQuery.error;
    if (activityQuery.error) throw activityQuery.error;

    const checkpoints = (checkpointQuery.data ?? []) as TimingCheckpoint[];
    const segments = (segmentQuery.data ?? []) as TimedSegment[];
    const activities = activityQuery.data ?? [];
    const activityIds = activities.map((activity: any) => activity.id);
    if (activityIds.length) {
      const { error: segmentDeleteError } = await supabase
        .from("segment_results")
        .delete()
        .in("activity_id", activityIds);
      if (segmentDeleteError) throw segmentDeleteError;
      const { error: passageDeleteError } = await supabase
        .from("checkpoint_passages")
        .delete()
        .in("activity_id", activityIds);
      if (passageDeleteError) throw passageDeleteError;
    }

    let passagesSaved = 0;
    let segmentsSaved = 0;
    let approximateActivities = 0;
    for (const activity of activities) {
      const points = (activity.gps_points ?? []) as GeoPoint[];
      if (points.length < 2) continue;
      const timing = timingForActivity(activity, points);
      if (!timing.precise) approximateActivities += 1;
      const passages = detectCheckpointPassages({
        activityPoints: points,
        elapsedSeconds: timing.elapsedSeconds,
        activityDistanceMeters: timing.distanceMeters,
        startedAt: activity.started_at,
        checkpoints,
      });
      const passed = passages.filter(
        (passage) =>
          passage.passed &&
          passage.point_index !== null &&
          passage.elapsed_s !== null &&
          passage.passed_at,
      );
      let savedPassages: Array<{ id: string; checkpoint_id: string }> = [];
      if (passed.length) {
        const { data, error } = await supabase
          .from("checkpoint_passages")
          .insert(
            passed.map((passage) => ({
              activity_id: activity.id,
              checkpoint_id: passage.checkpoint_id,
              point_index: passage.point_index,
              elapsed_s: passage.elapsed_s,
              activity_distance_m: passage.activity_distance_m,
              nearest_distance_m: passage.nearest_distance_m,
              passed_at: passage.passed_at,
            })),
          )
          .select("id, checkpoint_id");
        if (error) throw error;
        savedPassages = data ?? [];
        passagesSaved += savedPassages.length;
      }
      const passageIdByCheckpoint = new Map(
        savedPassages.map((passage) => [passage.checkpoint_id, passage.id]),
      );
      const completed = calculateSegmentResults(segments, passages).filter(
        (segment) => segment.completed && segment.elapsed_s !== null,
      );
      if (completed.length) {
        const { error } = await supabase.from("segment_results").insert(
          completed.map((segment) => ({
            activity_id: activity.id,
            segment_id: segment.segment_id,
            start_passage_id: passageIdByCheckpoint.get(
              segment.start_checkpoint_id,
            ),
            finish_passage_id: passageIdByCheckpoint.get(
              segment.finish_checkpoint_id,
            ),
            elapsed_s: segment.elapsed_s,
            status: "review",
          })),
        );
        if (error) throw error;
        segmentsSaved += completed.length;
      }
      const { error: validationError } = await supabase
        .from("validation_results")
        .update({
          checkpoints_passed: passed.length,
          checkpoints_total: checkpoints.length,
          updated_at: new Date().toISOString(),
        })
        .eq("activity_id", activity.id);
      if (validationError) throw validationError;
    }

    return NextResponse.json({
      reprocessed: activities.length,
      passages_saved: passagesSaved,
      segments_saved: segmentsSaved,
      approximate_activities: approximateActivities,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao recalcular passagens.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = (await request.json()) as {
      stageId?: string;
      name?: string;
      segmentType?: "climb" | "sprint" | "custom";
      startCheckpointId?: string;
      finishCheckpointId?: string;
    };
    const stageId = String(body.stageId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const segmentType = body.segmentType ?? "custom";
    const startCheckpointId = String(body.startCheckpointId ?? "").trim();
    const finishCheckpointId = String(body.finishCheckpointId ?? "").trim();
    if (
      !stageId ||
      !name ||
      !startCheckpointId ||
      !finishCheckpointId ||
      startCheckpointId === finishCheckpointId
    ) {
      return NextResponse.json(
        { error: "Informe nome, início e fim do segmento." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const { data: checkpoints, error: checkpointError } = await supabase
      .from("checkpoints")
      .select("id, sequence, stage_id")
      .in("id", [startCheckpointId, finishCheckpointId]);
    if (checkpointError) throw checkpointError;
    const start = (checkpoints ?? []).find(
      (checkpoint) => checkpoint.id === startCheckpointId,
    );
    const finish = (checkpoints ?? []).find(
      (checkpoint) => checkpoint.id === finishCheckpointId,
    );
    if (
      !start ||
      !finish ||
      start.stage_id !== stageId ||
      finish.stage_id !== stageId ||
      start.sequence >= finish.sequence
    ) {
      return NextResponse.json(
        {
          error:
            "O ponto final deve estar depois do ponto inicial na rota oficial.",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("timed_segments")
      .insert({
        stage_id: stageId,
        name,
        segment_type: segmentType,
        start_checkpoint_id: startCheckpointId,
        finish_checkpoint_id: finishCheckpointId,
      })
      .select(
        "id, stage_id, name, segment_type, start_checkpoint_id, finish_checkpoint_id, is_active",
      )
      .single();
    if (error) {
      if (migrationRequired(error))
        return NextResponse.json(
          {
            error:
              "Execute a migration 005_checkpoint_segment_engine.sql antes de criar segmentos.",
          },
          { status: 409 },
        );
      throw error;
    }
    return NextResponse.json({ segment: data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao criar segmento.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const segmentId = request.nextUrl.searchParams.get("segmentId")?.trim();
    if (!segmentId)
      return NextResponse.json(
        { error: "Segmento não informado." },
        { status: 400 },
      );
    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("timed_segments")
      .delete()
      .eq("id", segmentId);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao excluir segmento.",
      },
      { status: 500 },
    );
  }
}
