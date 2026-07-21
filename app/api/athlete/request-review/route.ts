import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { readRideWithGpsUser } from "@/lib/ridewithgps";

function athleteId(request: NextRequest) {
  return readRideWithGpsUser(request)?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const rideWithGpsUserId = athleteId(request);
    if (!rideWithGpsUserId) return NextResponse.json({ error: "Sessão do atleta não encontrada." }, { status: 401 });
    const body = await request.json() as { activityId?: string; note?: string };
    const activityId = String(body.activityId ?? "").trim();
    const note = String(body.note ?? "").trim();
    if (!activityId) return NextResponse.json({ error: "Atividade não informada." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: athlete, error: athleteError } = await supabase.from("athletes").select("id").eq("ride_with_gps_user_id", rideWithGpsUserId).single();
    if (athleteError || !athlete) return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
    const { data: activity, error: activityError } = await supabase.from("activities").select("id").eq("id", activityId).eq("athlete_id", athlete.id).single();
    if (activityError || !activity) return NextResponse.json({ error: "Atividade não encontrada para este atleta." }, { status: 404 });
    const { data: current, error: currentError } = await supabase.from("validation_results").select("id, notes").eq("activity_id", activity.id).single();
    if (currentError || !current) return NextResponse.json({ error: "Resultado de validação não encontrado." }, { status: 404 });
    const requestText = `SOLICITAÇÃO DO ATLETA (${new Date().toLocaleString("pt-BR")}): ${note || "Solicito revisão manual da atividade."}`;
    const notes = [current.notes, requestText].filter(Boolean).join("\n\n");
    const { error } = await supabase.from("validation_results").update({ status: "review", notes, updated_at: new Date().toISOString() }).eq("id", current.id);
    if (error) throw error;
    return NextResponse.json({ requested: true, status: "review" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao solicitar revisão." }, { status: 500 });
  }
}
