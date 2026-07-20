import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";

type Point = [number, number, number | null];

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function haversineKm(a: Point, b: Point) {
  const radiusKm = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(value));
}

function parseGpx(xml: string, intermediateCheckpointCount: number) {
  const pointRegex = /<(?:trkpt|rtept)\b[^>]*lat=["']([^"']+)["'][^>]*lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:trkpt|rtept)>/gi;
  const points: Point[] = [];
  let match: RegExpExecArray | null;
  while ((match = pointRegex.exec(xml))) {
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    const elevationMatch = match[3].match(/<ele>([^<]+)<\/ele>/i);
    const elevation = elevationMatch ? Number(elevationMatch[1]) : null;
    if (Number.isFinite(lat) && Number.isFinite(lng)) points.push([lat, lng, Number.isFinite(elevation) ? elevation : null]);
  }
  if (points.length < 2) throw new Error("O arquivo não contém pontos GPX suficientes.");

  let distanceKm = 0;
  let elevationM = 0;
  for (let index = 1; index < points.length; index += 1) {
    distanceKm += haversineKm(points[index - 1], points[index]);
    const previousElevation = points[index - 1][2];
    const currentElevation = points[index][2];
    if (previousElevation !== null && currentElevation !== null && currentElevation > previousElevation) elevationM += currentElevation - previousElevation;
  }

  const checkpointCount = Math.min(14, Math.max(3, intermediateCheckpointCount + 2));
  const checkpoints = Array.from({ length: checkpointCount }, (_, index) => {
    const pointIndex = Math.round((index / (checkpointCount - 1)) * (points.length - 1));
    const point = points[pointIndex];
    const isStart = index === 0;
    const isFinish = index === checkpointCount - 1;
    return {
      sequence: index,
      label: isStart ? "Largada" : isFinish ? "Chegada" : `CP ${index}`,
      latitude: point[0],
      longitude: point[1],
      route_progress: Number(((index / (checkpointCount - 1)) * 100).toFixed(2)),
      checkpoint_kind: isStart ? "start" : isFinish ? "finish" : "control",
      is_timing_point: true,
    };
  });

  return {
    points,
    distanceKm: Number(distanceKm.toFixed(3)),
    elevationM: Math.round(elevationM),
    start: points[0],
    finish: points[points.length - 1],
    checkpoints,
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const eventId = request.nextUrl.searchParams.get("eventId")?.trim() ?? "";
  const supabase = createSupabaseAdmin();
  let query = supabase
    .from("stages")
    .select("id, event_id, stage_number, name, route_label, stage_date, distance_km, elevation_m, direction_required, start_radius_m, finish_radius_m, auto_validate_min_coverage, review_min_coverage, route_tolerance_m, auto_validate_max_off_route_percent, review_max_off_route_percent, max_continuous_off_route_km, auto_validate_min_checkpoint_ratio, review_min_checkpoint_ratio, events(name), route_versions(id, version, file_name, distance_km, elevation_m, is_active, valid_from, created_at, change_note)");
  if (eventId) query = query.eq("event_id", eventId);
  let { data, error } = await query.order("stage_date", { ascending: true });
  let rulesModuleReady = true;
  if (error?.code === "42703") {
    rulesModuleReady = false;
    let legacyQuery = supabase.from("stages").select("id, event_id, stage_number, name, route_label, stage_date, distance_km, elevation_m, direction_required, start_radius_m, finish_radius_m, auto_validate_min_coverage, review_min_coverage, events(name), route_versions(id, version, file_name, distance_km, elevation_m, is_active, valid_from, created_at, change_note)");
    if (eventId) legacyQuery = legacyQuery.eq("event_id", eventId);
    const legacy = await legacyQuery.order("stage_date", { ascending: true });
    data = legacy.data as typeof data;
    error = legacy.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const stages = (data ?? []).map((stage) => ({ ...stage, routes: stage.route_versions ?? [] }));
  return NextResponse.json({ stages, rules_module_ready: rulesModuleReady });
}

function bounded(value: unknown, minimum: number, maximum: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json() as { stageId?: string; rules?: Record<string, unknown> };
    const stageId = String(body.stageId ?? "").trim();
    if (!stageId) return NextResponse.json({ error: "Etapa não informada." }, { status: 400 });
    const rules = body.rules ?? {};
    const payload = {
      route_tolerance_m: Math.round(bounded(rules.route_tolerance_m, 20, 500, 120)),
      start_radius_m: Math.round(bounded(rules.start_radius_m, 20, 1000, 300)),
      finish_radius_m: Math.round(bounded(rules.finish_radius_m, 20, 1000, 300)),
      direction_required: rules.direction_required !== false,
      auto_validate_min_coverage: bounded(rules.auto_validate_min_coverage, 50, 100, 95),
      review_min_coverage: bounded(rules.review_min_coverage, 30, 100, 80),
      auto_validate_max_off_route_percent: bounded(rules.auto_validate_max_off_route_percent, 0, 50, 5),
      review_max_off_route_percent: bounded(rules.review_max_off_route_percent, 0, 80, 20),
      max_continuous_off_route_km: bounded(rules.max_continuous_off_route_km, .1, 50, 1.5),
      auto_validate_min_checkpoint_ratio: bounded(rules.auto_validate_min_checkpoint_ratio, 0, 1, .95),
      review_min_checkpoint_ratio: bounded(rules.review_min_checkpoint_ratio, 0, 1, .8),
      updated_at: new Date().toISOString(),
    };
    if (payload.review_min_coverage > payload.auto_validate_min_coverage) return NextResponse.json({ error: "A cobertura de revisão não pode ser maior que a cobertura automática." }, { status: 400 });
    if (payload.auto_validate_max_off_route_percent > payload.review_max_off_route_percent) return NextResponse.json({ error: "O limite automático fora da rota não pode ser maior que o limite de revisão." }, { status: 400 });
    if (payload.review_min_checkpoint_ratio > payload.auto_validate_min_checkpoint_ratio) return NextResponse.json({ error: "A exigência de checkpoints para revisão não pode superar a automática." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from("stages").update(payload).eq("id", stageId).select("id").single();
    if (error?.code === "42703") return NextResponse.json({ error: "Execute a migration 009_stage_validation_rules.sql no Supabase." }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ stage: data, rules: payload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao salvar as regras." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const formData = await request.formData();
    const stageId = String(formData.get("stageId") ?? "");
    const changeNote = String(formData.get("changeNote") ?? "").trim();
    const checkpointCountInput = Number(formData.get("checkpointCount") ?? 5);
    const intermediateCheckpointCount = Number.isFinite(checkpointCountInput) ? Math.min(12, Math.max(1, Math.round(checkpointCountInput))) : 5;
    const file = formData.get("file");
    if (!stageId || !(file instanceof File)) return NextResponse.json({ error: "Etapa e arquivo GPX são obrigatórios." }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".gpx")) return NextResponse.json({ error: "Envie um arquivo com extensão .gpx." }, { status: 400 });

    const parsed = parseGpx(await file.text(), intermediateCheckpointCount);
    const supabase = createSupabaseAdmin();
    const { data: history, error: historyError } = await supabase.from("route_versions").select("id, version").eq("stage_id", stageId).order("version", { ascending: false }).limit(1);
    if (historyError) throw historyError;

    const version = (history?.[0]?.version ?? 0) + 1;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `${stageId}/v${version}-${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("official-routes").upload(storagePath, file, { contentType: "application/gpx+xml", upsert: false });
    if (uploadError) throw uploadError;

    await supabase.from("route_versions").update({ is_active: false, valid_until: new Date().toISOString() }).eq("stage_id", stageId).eq("is_active", true);
    const { data: route, error: routeError } = await supabase
      .from("route_versions")
      .insert({
        stage_id: stageId,
        version,
        file_name: file.name,
        storage_path: storagePath,
        distance_km: parsed.distanceKm,
        elevation_m: parsed.elevationM,
        start_lat: parsed.start[0],
        start_lng: parsed.start[1],
        finish_lat: parsed.finish[0],
        finish_lng: parsed.finish[1],
        points_count: parsed.points.length,
        route_points: parsed.points,
        is_active: true,
        change_note: changeNote || null,
        created_by: "organization-panel",
      })
      .select("id, version, file_name, distance_km, elevation_m, valid_from")
      .single();
    if (routeError) throw routeError;

    const { error: checkpointDeleteError } = await supabase.from("checkpoints").delete().eq("stage_id", stageId);
    if (checkpointDeleteError) throw checkpointDeleteError;
    const modernRows = parsed.checkpoints.map((checkpoint) => ({ stage_id: stageId, ...checkpoint, radius_m: 120 }));
    let { error: checkpointError } = await supabase.from("checkpoints").insert(modernRows);
    if (checkpointError?.code === "42703") {
      const legacyRows = modernRows.map(({ checkpoint_kind: _kind, is_timing_point: _timing, ...checkpoint }) => checkpoint);
      const legacyInsert = await supabase.from("checkpoints").insert(legacyRows);
      checkpointError = legacyInsert.error;
    }
    if (checkpointError) throw checkpointError;

    await supabase.from("stages").update({ distance_km: parsed.distanceKm, elevation_m: parsed.elevationM }).eq("id", stageId);
    return NextResponse.json({ route, checkpoints: parsed.checkpoints.length, intermediate_checkpoints: intermediateCheckpointCount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao processar o GPX." }, { status: 500 });
  }
}
