import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function migrationMissing(error: any) {
  return error?.code === "42P01" || error?.code === "42703";
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const eventId = request.nextUrl.searchParams.get("eventId")?.trim();
  if (!eventId) return NextResponse.json({ error: "Selecione o evento." }, { status: 400 });
  try {
    const supabase = createSupabaseAdmin();
    const { data: stages, error: stageError } = await supabase
      .from("stages")
      .select("id, event_id, stage_number, name, results_published, results_locked, results_published_at")
      .eq("event_id", eventId)
      .order("stage_number");
    if (migrationMissing(stageError)) return NextResponse.json({ module_ready: false, message: "Execute a migration 015_race_stewarding.sql no Supabase." });
    if (stageError) throw stageError;
    const stageIds = (stages ?? []).map((stage) => stage.id);
    const [registrationsQuery, allActivitiesQuery, validationsQuery, routesQuery] = await Promise.all([
      supabase
        .from("registrations")
        .select("id, athlete_id, status, payment_status")
        .eq("event_id", eventId),
      stageIds.length
        ? supabase
          .from("activities")
          .select("id, stage_id, athlete_id, created_at")
          .in("stage_id", stageIds)
        : Promise.resolve({ data: [], error: null }),
      stageIds.length
        ? supabase
          .from("validation_results")
          .select("id, activity_id, stage_id, status, updated_at")
          .in("stage_id", stageIds)
        : Promise.resolve({ data: [], error: null }),
      stageIds.length
        ? supabase
          .from("route_versions")
          .select("id, stage_id, is_active")
          .in("stage_id", stageIds)
          .eq("is_active", true)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (registrationsQuery.error) throw registrationsQuery.error;
    if (allActivitiesQuery.error) throw allActivitiesQuery.error;
    if (validationsQuery.error) throw validationsQuery.error;
    if (routesQuery.error) throw routesQuery.error;
    const { data: results, error: resultError } = stageIds.length
      ? await supabase.from("stage_results")
        .select("id, event_id, stage_id, athlete_id, registration_id, activity_id, full_name, bib_number, category, official_time_s, manual_time_s, time_penalty_s, points_penalty, final_time_s, position, weighted_points, status, integrity_status, admin_note, updated_at")
        .in("stage_id", stageIds).order("stage_id").order("position", { nullsFirst: false })
      : { data: [], error: null };
    if (resultError) throw resultError;
    const activityIds = [...new Set((results ?? []).map((result) => result.activity_id).filter(Boolean))];
    const { data: activities, error: activityError } = activityIds.length
      ? await supabase.from("activities").select("id, stage_id, athlete_id, source, source_activity_id, track_fingerprint").in("id", activityIds)
      : { data: [], error: null };
    if (activityError) throw activityError;

    const activityMap = new Map((activities ?? []).map((activity) => [activity.id, activity]));
    const groups = new Map<string, any[]>();
    for (const result of results ?? []) {
      const activity: any = activityMap.get(result.activity_id);
      if (!activity?.track_fingerprint) continue;
      const key = `${result.stage_id}:${activity.track_fingerprint}`;
      const current = groups.get(key) ?? [];
      current.push(result);
      groups.set(key, current);
    }
    const duplicateResultIds = new Set([...groups.values()].filter((items) => new Set(items.map((item) => item.athlete_id)).size > 1).flatMap((items) => items.map((item) => item.id)));
    const duplicateGroups = [...groups.entries()].filter(([, items]) => new Set(items.map((item) => item.athlete_id)).size > 1).map(([key, items]) => ({
      fingerprint: key.split(":").at(-1), stage_id: items[0].stage_id,
      results: items.map((item) => ({ id: item.id, full_name: item.full_name, bib_number: item.bib_number })),
    }));
    const staleDuplicates = (results ?? []).filter((result) => duplicateResultIds.has(result.id) && result.integrity_status === "clean").map((result) => result.id);
    if (staleDuplicates.length) await supabase.from("stage_results").update({ integrity_status: "duplicate", updated_at: new Date().toISOString() }).in("id", staleDuplicates);

    const { data: audit, error: auditError } = stageIds.length
      ? await supabase.from("stage_result_audit_log").select("id, stage_id, result_id, action, note, previous_value, new_value, created_at").in("stage_id", stageIds).order("created_at", { ascending: false }).limit(100)
      : { data: [], error: null };
    if (auditError) throw auditError;

    const registrations = registrationsQuery.data ?? [];
    const allActivities = allActivitiesQuery.data ?? [];
    const validations = validationsQuery.data ?? [];
    const activeRoutes = routesQuery.data ?? [];
    const eligibleRegistrations = registrations.filter((registration) =>
      registration.status === "confirmed"
      && ["paid", "courtesy"].includes(registration.payment_status),
    );
    const linkedRegistrations = eligibleRegistrations.filter((registration) => Boolean(registration.athlete_id));
    const activityIdsWithValidation = new Set(validations.map((validation) => validation.activity_id));
    const unprocessedActivities = allActivities.filter((activity) => !activityIdsWithValidation.has(activity.id));
    const pendingDecisions = (results ?? []).filter((result) =>
      !result.admin_note
      || result.status === "review"
      || (staleDuplicates.includes(result.id) ? "duplicate" : result.integrity_status) === "duplicate",
    );
    const stagePipeline = (stages ?? []).map((stage) => {
      const stageActivities = allActivities.filter((activity) => activity.stage_id === stage.id);
      const stageValidations = validations.filter((validation) => validation.stage_id === stage.id);
      const stageResults = (results ?? []).filter((result) => result.stage_id === stage.id);
      const duplicateCount = stageResults.filter((result) =>
        (staleDuplicates.includes(result.id) ? "duplicate" : result.integrity_status) === "duplicate",
      ).length;
      const decisionCount = stageResults.filter((result) =>
        !result.admin_note || result.status === "review"
        || (staleDuplicates.includes(result.id) ? "duplicate" : result.integrity_status) === "duplicate",
      ).length;
      return {
        stage_id: stage.id,
        route_ready: activeRoutes.some((route) => route.stage_id === stage.id),
        activities: stageActivities.length,
        unprocessed: stageActivities.filter((activity) => !activityIdsWithValidation.has(activity.id)).length,
        validated: stageValidations.filter((validation) => validation.status === "validated").length,
        review: stageValidations.filter((validation) => validation.status === "review").length,
        rejected: stageValidations.filter((validation) => validation.status === "rejected").length,
        pending_validation: stageValidations.filter((validation) => validation.status === "pending").length,
        results: stageResults.length,
        pending_decisions: decisionCount,
        duplicates: duplicateCount,
        published: Boolean(stage.results_published),
        locked: Boolean(stage.results_locked),
      };
    });

    return NextResponse.json({
      module_ready: true, stages: stages ?? [],
      results: (results ?? []).map((result) => ({ ...result, integrity_status: staleDuplicates.includes(result.id) ? "duplicate" : result.integrity_status, activity: activityMap.get(result.activity_id) ?? null })),
      duplicate_groups: duplicateGroups, audit: audit ?? [],
      generated_at: new Date().toISOString(),
      pipeline: {
        registrations: registrations.length,
        eligible_registrations: eligibleRegistrations.length,
        linked_registrations: linkedRegistrations.length,
        activities: allActivities.length,
        unprocessed_activities: unprocessedActivities.length,
        validations: validations.length,
        validated: validations.filter((validation) => validation.status === "validated").length,
        review: validations.filter((validation) => validation.status === "review").length,
        rejected: validations.filter((validation) => validation.status === "rejected").length,
        pending_validation: validations.filter((validation) => validation.status === "pending").length,
        results: (results ?? []).length,
        pending_decisions: pendingDecisions.length,
        published_stages: (stages ?? []).filter((stage) => stage.results_published).length,
        total_stages: (stages ?? []).length,
      },
      stage_pipeline: stagePipeline,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar a apuração." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "results.review")) return unauthorized();
  try {
    const body = await request.json() as { resultId?: string; status?: string; timePenaltyS?: number; pointsPenalty?: number; acceptDuplicate?: boolean; note?: string };
    const resultId = String(body.resultId ?? "").trim();
    const note = String(body.note ?? "").trim();
    const status = String(body.status ?? "provisional");
    if (!resultId) return NextResponse.json({ error: "Informe o resultado." }, { status: 400 });
    if (!["provisional", "review", "disqualified", "dnf"].includes(status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data: current, error: currentError } = await supabase.from("stage_results").select("*").eq("id", resultId).single();
    if (currentError || !current) return NextResponse.json({ error: "Resultado não encontrado." }, { status: 404 });
    const { data: stage, error: stageError } = await supabase.from("stages").select("id, results_locked").eq("id", current.stage_id).single();
    if (stageError) throw stageError;
    if (stage.results_locked) return NextResponse.json({ error: "A etapa está publicada e bloqueada. Reabra a apuração antes de alterar." }, { status: 423 });
    const timePenaltyS = Math.max(0, Math.round(Number(body.timePenaltyS ?? 0)));
    const pointsPenalty = Math.max(0, Number(body.pointsPenalty ?? 0));
    const hasException = status !== "provisional" || timePenaltyS > 0 || pointsPenalty > 0
      || (current.integrity_status === "duplicate" && body.acceptDuplicate);
    if (hasException && note.length < 3) {
      return NextResponse.json({ error: "Registre o motivo da revisão, penalidade ou exceção." }, { status: 400 });
    }
    const decisionNote = note || "Resultado conferido e aprovado sem ressalvas.";
    const baseTime = Number(current.manual_time_s ?? current.official_time_s);
    const update = {
      status, time_penalty_s: timePenaltyS, points_penalty: pointsPenalty,
      final_time_s: baseTime + timePenaltyS,
      integrity_status: body.acceptDuplicate ? "reviewed" : current.integrity_status,
      admin_note: decisionNote, updated_at: new Date().toISOString(),
    };
    const { data: saved, error: updateError } = await supabase.from("stage_results").update(update).eq("id", resultId).select("*").single();
    if (updateError) throw updateError;
    const { error: auditError } = await supabase.from("stage_result_audit_log").insert({
      event_id: current.event_id, stage_id: current.stage_id, result_id: current.id,
      action: "adjust_result", note: decisionNote, previous_value: current, new_value: saved,
    });
    if (auditError) throw auditError;
    await recordAdminAudit(request, { action: "result.adjusted", resourceType: "stage_result", resourceId: resultId, eventId: current.event_id, details: { status, time_penalty_s: timePenaltyS, points_penalty: pointsPenalty, note: decisionNote } });
    return NextResponse.json({ updated: true, result: saved });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao ajustar o resultado." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "results.publish")) return unauthorized();
  try {
    const body = await request.json() as { stageId?: string; action?: "publish" | "reopen"; note?: string };
    const stageId = String(body.stageId ?? "").trim();
    const note = String(body.note ?? "").trim();
    if (!stageId || !body.action) return NextResponse.json({ error: "Selecione a etapa e a ação." }, { status: 400 });
    if (body.action === "reopen" && note.length < 3) return NextResponse.json({ error: "Registre o motivo para reabrir uma etapa publicada." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data: stage, error: stageError } = await supabase.from("stages").select("id, event_id, results_locked, results_published").eq("id", stageId).single();
    if (stageError || !stage) return NextResponse.json({ error: "Etapa não encontrada." }, { status: 404 });
    const now = new Date().toISOString();
    if (body.action === "publish") {
      const { data: blockers, error: blockerError } = await supabase.from("stage_results").select("id, status, integrity_status").eq("stage_id", stageId);
      if (blockerError) throw blockerError;
      const pending = (blockers ?? []).filter((result) => result.status === "review" || result.integrity_status === "duplicate");
      if (pending.length) return NextResponse.json({ error: `Resolva ${pending.length} resultado(s) em revisão ou com duplicidade antes de publicar.` }, { status: 409 });
      const { error: resultError } = await supabase.from("stage_results").update({ status: "official", published_at: now, updated_at: now }).eq("stage_id", stageId).eq("status", "provisional");
      if (resultError) throw resultError;
      const { error } = await supabase.from("stages").update({ results_published: true, results_locked: true, results_published_at: now, updated_at: now }).eq("id", stageId);
      if (error) throw error;
    } else {
      const { error: resultError } = await supabase.from("stage_results").update({ status: "provisional", published_at: null, updated_at: now }).eq("stage_id", stageId).eq("status", "official");
      if (resultError) throw resultError;
      const { error } = await supabase.from("stages").update({ results_published: false, results_locked: false, results_published_at: null, updated_at: now }).eq("id", stageId);
      if (error) throw error;
    }
    const { error: auditError } = await supabase.from("stage_result_audit_log").insert({
      event_id: stage.event_id, stage_id: stage.id, action: body.action === "publish" ? "publish_stage" : "reopen_stage",
      note: note || "Etapa conferida, aprovada e publicada sem ressalvas.", previous_value: stage, new_value: { results_published: body.action === "publish", results_locked: body.action === "publish" },
    });
    if (auditError) throw auditError;
    await recordAdminAudit(request, { action: body.action === "publish" ? "stage.published" : "stage.reopened", resourceType: "stage", resourceId: stageId, eventId: stage.event_id, details: { note } });
    return NextResponse.json({ updated: true, action: body.action });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao atualizar a etapa." }, { status: 500 });
  }
}
