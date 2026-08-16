import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { buildOverallClassification } from "@/lib/classification-engine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = createSupabaseAdmin();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, slug, name, location, starts_on, ends_on")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: "Evento não encontrado ou ainda não publicado." }, { status: 404 });

    const { data: stages, error: stageError } = await supabase
      .from("stages")
      .select("id, stage_number, name, route_label, stage_date, classification_weight, results_published, results_published_at")
      .eq("event_id", event.id)
      .eq("results_published", true)
      .order("stage_number", { ascending: true });
    if (stageError) throw stageError;
    const stageIds = (stages ?? []).map((stage) => stage.id);

    const { data: results, error: resultError } = stageIds.length
      ? await supabase
        .from("stage_results")
        .select("id, stage_id, athlete_id, registration_id, full_name, bib_number, category, journey_format, official_time_s, time_penalty_s, points_penalty, final_time_s, position, weighted_points, status, admin_note, published_at")
        .in("stage_id", stageIds)
        .in("status", ["official", "disqualified", "dnf"])
        .order("category", { ascending: true })
        .order("position", { ascending: true, nullsFirst: false })
      : { data: [], error: null };
    if (resultError) throw resultError;

    const stageMap = new Map((stages ?? []).map((stage) => [stage.id, stage]));
    const publicResults = (results ?? []).map((result) => ({
      id: result.id,
      stage_id: result.stage_id,
      athlete_id: result.athlete_id,
      registration_id: result.registration_id,
      full_name: result.full_name,
      bib_number: result.bib_number,
      category: result.category,
      journey_format: result.journey_format ?? "ultimate",
      official_time_s: Number(result.official_time_s),
      time_penalty_s: Number(result.time_penalty_s ?? 0),
      points_penalty: Number(result.points_penalty ?? 0),
      final_time_s: Number(result.final_time_s),
      position: result.position,
      weighted_points: Number(result.weighted_points),
      status: result.status,
      penalty_reason:
        (Number(result.time_penalty_s ?? 0) > 0
          || Number(result.points_penalty ?? 0) > 0
          || result.status !== "official")
          ? result.admin_note
          : null,
      stage: stageMap.get(result.stage_id) ?? null,
    }));

    const overall = buildOverallClassification(publicResults.map((result) => ({
      athlete_id: result.athlete_id,
      registration_id: result.registration_id,
      full_name: result.full_name,
      bib_number: result.bib_number,
      category: result.category,
      journey_format: result.journey_format,
      stage_id: result.stage_id,
      stage_number: Number(result.stage?.stage_number ?? 0),
      position: result.position,
      final_time_s: result.final_time_s,
      weighted_points: result.weighted_points,
      status: result.status,
    })), (stages ?? []).length, { ultimate: [1, 2, 3, 4], short: [3, 4] }).map((row) => ({
      ...row,
      total_time_s: row.stage_results.reduce((total, result) => total + Number(result.final_time_s), 0),
    }));

    const latestPublication = (stages ?? [])
      .map((stage) => stage.results_published_at)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

    return NextResponse.json(
      {
        event,
        stages: stages ?? [],
        results: publicResults,
        overall,
        generated_at: new Date().toISOString(),
        latest_publication_at: latestPublication,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Failed to load public results", error);
    return NextResponse.json(
      { error: "Falha ao carregar os resultados públicos." },
      { status: 500 },
    );
  }
}
