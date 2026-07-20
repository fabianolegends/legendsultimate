import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function stagePayload(body: Record<string, unknown>) {
  const timeLimitHours = body.time_limit_hours === "" || body.time_limit_hours == null ? null : Number(body.time_limit_hours);
  return {
    name: String(body.name ?? "").trim(),
    route_label: String(body.route_label ?? "").trim() || null,
    stage_date: String(body.stage_date ?? "").trim(),
    classification_weight: Math.min(5, Math.max(.1, Number(body.classification_weight ?? 1))),
    time_limit_s: Number.isFinite(timeLimitHours) && Number(timeLimitHours) > 0 ? Math.round(Number(timeLimitHours) * 3600) : null,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventId = String(body.event_id ?? "").trim();
    const payload = stagePayload(body);
    if (!eventId || !payload.name || !payload.stage_date) return NextResponse.json({ error: "Evento, nome e data da etapa são obrigatórios." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data: current, error: currentError } = await supabase.from("stages").select("stage_number").eq("event_id", eventId).order("stage_number", { ascending: false }).limit(1);
    if (currentError) throw currentError;
    const stageNumber = Number(current?.[0]?.stage_number ?? 0) + 1;
    const { data, error } = await supabase.from("stages").insert({ ...payload, event_id: eventId, stage_number: stageNumber }).select("id, event_id, stage_number, name, route_label, stage_date, classification_weight, time_limit_s, results_published").single();
    if (error?.code === "23505") return NextResponse.json({ error: "Já existe uma etapa com essa posição no evento. Atualize a página e tente novamente." }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ stage: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível adicionar a etapa." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const stageId = String(body.stage_id ?? "").trim();
    const payload = stagePayload(body);
    if (!stageId || !payload.name || !payload.stage_date) return NextResponse.json({ error: "Etapa, nome e data são obrigatórios." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from("stages").update(payload).eq("id", stageId).select("id, event_id, stage_number, name, route_label, stage_date, classification_weight, time_limit_s, results_published").single();
    if (error) throw error;
    return NextResponse.json({ stage: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar a etapa." }, { status: 500 });
  }
}
