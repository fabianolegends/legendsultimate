import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { GeoPoint, parseGpx, validateActivity } from "@/lib/race-engine";
import { isAdminRequest } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const stageId = String(formData.get("stageId") ?? "");
    const file = formData.get("file");
    const toleranceM = Number(formData.get("toleranceM") ?? 120);

    if (!stageId || !(file instanceof File)) {
      return NextResponse.json({ error: "Selecione uma etapa e envie o GPX da atividade." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      return NextResponse.json({ error: "O arquivo da atividade precisa estar no formato GPX." }, { status: 400 });
    }

    const activityPoints = parseGpx(await file.text());
    const supabase = createSupabaseAdmin();
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
    });

    return NextResponse.json({
      report,
      route: {
        id: route.id,
        version: route.version,
        file_name: route.file_name,
        distance_km: route.distance_km,
        elevation_m: route.elevation_m,
      },
      activity: { file_name: file.name, points_count: activityPoints.length },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao validar a atividade.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
