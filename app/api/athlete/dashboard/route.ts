import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function readAthlete(request: NextRequest) {
  const raw = request.cookies.get("strava_athlete")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as { id?: number; firstname?: string; lastname?: string; profile?: string }; } catch { return null; }
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

    const { data: stages, error: stageError } = await supabase
      .from("stages")
      .select("id, name, route_label, stage_date, distance_km, elevation_m, stage_number, auto_validate_min_coverage, review_min_coverage, events(name), route_versions(id, version, file_name, is_active)")
      .order("stage_date", { ascending: true });
    if (stageError) throw stageError;

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

    const validationByActivity = new Map(validations.map((item) => [item.activity_id, item]));
    const submissions = (activities ?? []).map((activity) => ({ ...activity, validation: validationByActivity.get(activity.id) ?? null }));
    const normalizedStages = (stages ?? []).map((stage: any) => ({
      ...stage,
      event_name: Array.isArray(stage.events) ? stage.events[0]?.name : stage.events?.name,
      route_active: (stage.route_versions ?? []).some((route: any) => route.is_active),
    }));

    return NextResponse.json({ athlete: { ...athleteCookie, database_id: athlete.id, full_name: athlete.full_name }, stages: normalizedStages, submissions });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar o Passport." }, { status: 500 });
  }
}
