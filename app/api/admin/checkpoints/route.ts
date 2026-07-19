import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";
import type { GeoPoint } from "@/lib/race-engine";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function migrationRequired(error?: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || error?.code === "42703" || Boolean(error?.message?.includes("timed_segments"));
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
  if (!stageId) return NextResponse.json({ error: "Selecione uma etapa." }, { status: 400 });

  try {
    const supabase = createSupabaseAdmin();
    const [{ data: stage, error: stageError }, { data: route, error: routeError }, { data: checkpoints, error: checkpointError }] = await Promise.all([
      supabase.from("stages").select("id, name, route_label, stage_date, distance_km, elevation_m").eq("id", stageId).single(),
      supabase.from("route_versions").select("id, version, file_name, route_points").eq("stage_id", stageId).eq("is_active", true).single(),
      supabase.from("checkpoints").select("*").eq("stage_id", stageId).order("sequence", { ascending: true }),
    ]);
    if (stageError || !stage) return NextResponse.json({ error: stageError?.message ?? "Etapa não encontrada." }, { status: 404 });
    if (routeError || !route) return NextResponse.json({ error: routeError?.message ?? "A etapa não possui rota ativa." }, { status: 404 });
    if (checkpointError) throw checkpointError;

    const { data: segments, error: segmentError } = await supabase
      .from("timed_segments")
      .select("id, stage_id, name, segment_type, start_checkpoint_id, finish_checkpoint_id, is_active, created_at")
      .eq("stage_id", stageId)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      module_ready: !segmentError,
      migration_required: migrationRequired(segmentError),
      stage,
      route: { ...route, route_points: route.route_points ?? [] },
      checkpoints: checkpoints ?? [],
      segments: segmentError ? [] : segments ?? [],
      module_message: segmentError ? "Execute a migration 005_checkpoint_segment_engine.sql no Supabase para habilitar segmentos e cronometragem." : null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar checkpoints." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json() as {
      stageId?: string;
      checkpoints?: Array<{ sequence?: number; label?: string; route_progress?: number; radius_m?: number }>;
    };
    const stageId = String(body.stageId ?? "").trim();
    const definitions = Array.isArray(body.checkpoints) ? body.checkpoints : [];
    if (!stageId || definitions.length < 3) {
      return NextResponse.json({ error: "A etapa precisa ter largada, ao menos um checkpoint e chegada." }, { status: 400 });
    }
    if (definitions.length > 14) return NextResponse.json({ error: "O limite é de 12 checkpoints intermediários." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: route, error: routeError } = await supabase
      .from("route_versions")
      .select("route_points")
      .eq("stage_id", stageId)
      .eq("is_active", true)
      .single();
    if (routeError || !route) return NextResponse.json({ error: routeError?.message ?? "Rota ativa não encontrada." }, { status: 404 });
    const routePoints = (route.route_points ?? []) as GeoPoint[];
    if (routePoints.length < 2) return NextResponse.json({ error: "A rota ativa não possui pontos suficientes." }, { status: 422 });

    const normalized = definitions
      .map((definition, index) => {
        const isStart = index === 0;
        const isFinish = index === definitions.length - 1;
        const routeProgress = isStart ? 0 : isFinish ? 100 : Math.min(99.99, Math.max(0.01, Number(definition.route_progress ?? 0)));
        const coordinate = pointAtProgress(routePoints, routeProgress);
        return {
          stage_id: stageId,
          sequence: index,
          label: String(definition.label ?? (isStart ? "Largada" : isFinish ? "Chegada" : `CP ${index}`)).trim() || `CP ${index}`,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          radius_m: Math.min(500, Math.max(30, Math.round(Number(definition.radius_m ?? 120)))),
          route_progress: Number(routeProgress.toFixed(2)),
          checkpoint_kind: isStart ? "start" : isFinish ? "finish" : "control",
          is_timing_point: true,
        };
      })
      .sort((a, b) => a.route_progress - b.route_progress)
      .map((checkpoint, index, all) => ({
        ...checkpoint,
        sequence: index,
        label: index === 0 ? "Largada" : index === all.length - 1 ? "Chegada" : checkpoint.label,
        checkpoint_kind: index === 0 ? "start" : index === all.length - 1 ? "finish" : "control",
      }));

    const { data: existing, error: existingError } = await supabase
      .from("checkpoints")
      .select("id, sequence")
      .eq("stage_id", stageId);
    if (existingError) throw existingError;
    const existingBySequence = new Map((existing ?? []).map((checkpoint) => [checkpoint.sequence, checkpoint.id]));
    const keptIds: string[] = [];

    for (const checkpoint of normalized) {
      const existingId = existingBySequence.get(checkpoint.sequence);
      if (existingId) {
        const { error } = await supabase.from("checkpoints").update(checkpoint).eq("id", existingId);
        if (error) {
          if (migrationRequired(error)) return NextResponse.json({ error: "Execute a migration 005_checkpoint_segment_engine.sql antes de salvar." }, { status: 409 });
          throw error;
        }
        keptIds.push(existingId);
      } else {
        const { data, error } = await supabase.from("checkpoints").insert(checkpoint).select("id").single();
        if (error) {
          if (migrationRequired(error)) return NextResponse.json({ error: "Execute a migration 005_checkpoint_segment_engine.sql antes de salvar." }, { status: 409 });
          throw error;
        }
        keptIds.push(data.id);
      }
    }

    const obsoleteIds = (existing ?? []).filter((checkpoint) => !keptIds.includes(checkpoint.id)).map((checkpoint) => checkpoint.id);
    if (obsoleteIds.length) {
      const { error } = await supabase.from("checkpoints").delete().in("id", obsoleteIds);
      if (error) throw error;
    }

    const { data: saved, error: savedError } = await supabase.from("checkpoints").select("*").eq("stage_id", stageId).order("sequence", { ascending: true });
    if (savedError) throw savedError;
    return NextResponse.json({ saved: true, checkpoints: saved ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao salvar checkpoints." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json() as {
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
    if (!stageId || !name || !startCheckpointId || !finishCheckpointId || startCheckpointId === finishCheckpointId) {
      return NextResponse.json({ error: "Informe nome, início e fim do segmento." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: checkpoints, error: checkpointError } = await supabase
      .from("checkpoints")
      .select("id, sequence, stage_id")
      .in("id", [startCheckpointId, finishCheckpointId]);
    if (checkpointError) throw checkpointError;
    const start = (checkpoints ?? []).find((checkpoint) => checkpoint.id === startCheckpointId);
    const finish = (checkpoints ?? []).find((checkpoint) => checkpoint.id === finishCheckpointId);
    if (!start || !finish || start.stage_id !== stageId || finish.stage_id !== stageId || start.sequence >= finish.sequence) {
      return NextResponse.json({ error: "O ponto final deve estar depois do ponto inicial na rota oficial." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("timed_segments")
      .insert({ stage_id: stageId, name, segment_type: segmentType, start_checkpoint_id: startCheckpointId, finish_checkpoint_id: finishCheckpointId })
      .select("id, stage_id, name, segment_type, start_checkpoint_id, finish_checkpoint_id, is_active")
      .single();
    if (error) {
      if (migrationRequired(error)) return NextResponse.json({ error: "Execute a migration 005_checkpoint_segment_engine.sql antes de criar segmentos." }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ segment: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar segmento." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const segmentId = request.nextUrl.searchParams.get("segmentId")?.trim();
    if (!segmentId) return NextResponse.json({ error: "Segmento não informado." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("timed_segments").delete().eq("id", segmentId);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao excluir segmento." }, { status: 500 });
  }
}
