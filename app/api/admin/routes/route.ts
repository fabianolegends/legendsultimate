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
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(value));
}

function parseGpx(xml: string) {
  const pointRegex = /<(?:trkpt|rtept)\b[^>]*lat=["']([^"']+)["'][^>]*lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:trkpt|rtept)>/gi;
  const points: Point[] = [];
  let match: RegExpExecArray | null;

  while ((match = pointRegex.exec(xml))) {
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    const elevationMatch = match[3].match(/<ele>([^<]+)<\/ele>/i);
    const elevation = elevationMatch ? Number(elevationMatch[1]) : null;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      points.push([lat, lng, Number.isFinite(elevation) ? elevation : null]);
    }
  }

  if (points.length < 2) throw new Error("O arquivo não contém pontos GPX suficientes.");

  let distanceKm = 0;
  let elevationM = 0;
  for (let index = 1; index < points.length; index += 1) {
    distanceKm += haversineKm(points[index - 1], points[index]);
    const previousElevation = points[index - 1][2];
    const currentElevation = points[index][2];
    if (previousElevation !== null && currentElevation !== null && currentElevation > previousElevation) {
      elevationM += currentElevation - previousElevation;
    }
  }

  const checkpointCount = Math.min(21, Math.max(6, Math.round(distanceKm / 5) + 1));
  const checkpoints = Array.from({ length: checkpointCount }, (_, index) => {
    const pointIndex = Math.round((index / (checkpointCount - 1)) * (points.length - 1));
    const point = points[pointIndex];
    return {
      sequence: index,
      label: index === 0 ? "Largada" : index === checkpointCount - 1 ? "Chegada" : `CP ${index}`,
      latitude: point[0],
      longitude: point[1],
      route_progress: Number(((index / (checkpointCount - 1)) * 100).toFixed(2)),
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
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("stages")
    .select("id, name, route_label, stage_date, distance_km, elevation_m, events(name), route_versions(id, version, file_name, distance_km, elevation_m, is_active, valid_from, created_at, change_note)")
    .order("stage_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const stages = (data ?? []).map((stage) => ({ ...stage, routes: stage.route_versions ?? [] }));
  return NextResponse.json({ stages });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const formData = await request.formData();
    const stageId = String(formData.get("stageId") ?? "");
    const changeNote = String(formData.get("changeNote") ?? "").trim();
    const file = formData.get("file");

    if (!stageId || !(file instanceof File)) {
      return NextResponse.json({ error: "Etapa e arquivo GPX são obrigatórios." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      return NextResponse.json({ error: "Envie um arquivo com extensão .gpx." }, { status: 400 });
    }

    const parsed = parseGpx(await file.text());
    const supabase = createSupabaseAdmin();
    const { data: history, error: historyError } = await supabase
      .from("route_versions")
      .select("id, version")
      .eq("stage_id", stageId)
      .order("version", { ascending: false })
      .limit(1);
    if (historyError) throw historyError;

    const version = (history?.[0]?.version ?? 0) + 1;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `${stageId}/v${version}-${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("official-routes")
      .upload(storagePath, file, { contentType: "application/gpx+xml", upsert: false });
    if (uploadError) throw uploadError;

    await supabase
      .from("route_versions")
      .update({ is_active: false, valid_until: new Date().toISOString() })
      .eq("stage_id", stageId)
      .eq("is_active", true);

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
    const { error: checkpointError } = await supabase.from("checkpoints").insert(
      parsed.checkpoints.map((checkpoint) => ({ stage_id: stageId, ...checkpoint, radius_m: 180 })),
    );
    if (checkpointError) throw checkpointError;

    await supabase.from("stages").update({ distance_km: parsed.distanceKm, elevation_m: parsed.elevationM }).eq("id", stageId);
    return NextResponse.json({ route, checkpoints: parsed.checkpoints.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao processar o GPX.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
