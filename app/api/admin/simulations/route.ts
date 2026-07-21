import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const athletes = [
  "André Horizonte", "Bruno Serra", "Carlos Vale", "Diego Campo", "Eduardo Trilha",
  "Ana Pedreira", "Beatriz Lago", "Carolina Mata", "Daniela Rocha", "Elisa Caminho",
];
const basePoints = [100, 85, 72, 61, 52];

function routePoints(stage: number) {
  const lat = -29.95 + stage * .04;
  const lng = -51.15 + stage * .025;
  return Array.from({ length: 101 }, (_, index) => [
    lat + index * .0003,
    lng + Math.sin(index / 10) * .0005,
    100 + Math.round(index * 1.8 + Math.sin(index / 8) * 12),
  ]);
}

function gpxFixture(points: number[][], name: string) {
  const track = points.map((point, index) => `<trkpt lat="${point[0]}" lon="${point[1]}"><ele>${point[2]}</ele><time>${new Date(Date.UTC(2026, 8, 11, 10, 0, index * 20)).toISOString()}</time></trkpt>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Legends Core"><trk><name>${name}</name><trkseg>${track}</trkseg></trk></gpx>`;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return NextResponse.json({ error: "Acesso sem permissão para criar simulações." }, { status: 403 });
  const supabase = createSupabaseAdmin();
  const suffix = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  let eventId: string | null = null;
  let athleteIds: string[] = [];
  try {
    const { data: event, error: eventError } = await supabase.from("events").insert({
      slug: `simulacao-completa-${suffix}`,
      name: `Simulação completa ${suffix.slice(6, 8)}/${suffix.slice(4, 6)}`,
      description: "Evento fictício gerado pelo Legends Core para análise integral do Race Engine.",
      location: "Laboratório Legends",
      timezone: "America/Sao_Paulo",
      status: "draft",
      starts_on: "2026-09-12",
      ends_on: "2026-09-13",
      event_type: "stage_race",
      scoring_mode: "weighted_points",
      registration_source: "manual",
      access_mode: "invite",
      participant_limit: 10,
      is_test: true,
      registration_open: false,
    }).select("id, slug, name").single();
    if (eventError || !event) throw eventError ?? new Error("Não foi possível criar o evento de simulação.");
    eventId = event.id;

    const { data: stages, error: stageError } = await supabase.from("stages").insert([1, 2].map((stage) => ({
      event_id: event.id,
      stage_number: stage,
      name: `Etapa simulada ${stage}`,
      route_label: `GPX fictício · Dia ${stage}`,
      stage_date: `2026-09-${11 + stage}`,
      distance_km: 3.45,
      elevation_m: 190,
      direction_required: true,
      route_tolerance_m: 60,
      start_radius_m: 30,
      finish_radius_m: 30,
      checkpoint_radius_m: 30,
      auto_validate_min_coverage: 95,
      review_min_coverage: 80,
      auto_validate_max_off_route_percent: 5,
      review_max_off_route_percent: 20,
      max_continuous_off_route_km: 1.5,
      auto_validate_min_checkpoint_ratio: .95,
      review_min_checkpoint_ratio: .8,
      classification_weight: stage === 2 ? 4 : 1,
      time_limit_s: 7200,
      results_published: false,
      results_locked: false,
    }))).select("id, stage_number, stage_date");
    if (stageError || !stages?.length) throw stageError ?? new Error("Não foi possível criar as etapas.");

    const checkpoints: Array<Record<string, unknown>> = [];
    for (const stage of stages) {
      const points = routePoints(stage.stage_number);
      const gpx = gpxFixture(points, `Etapa simulada ${stage.stage_number}`);
      const { error: routeError } = await supabase.from("route_versions").insert({
        stage_id: stage.id,
        version: 1,
        file_name: `simulacao-etapa-${stage.stage_number}.gpx`,
        storage_path: null,
        distance_km: 3.45,
        elevation_m: 190,
        start_lat: points[0][0],
        start_lng: points[0][1],
        finish_lat: points.at(-1)![0],
        finish_lng: points.at(-1)![1],
        points_count: points.length,
        route_points: points,
        is_active: true,
        change_note: "Percurso GPX fictício para simulação integral.",
        created_by: "complete-simulation",
      });
      if (routeError) throw routeError;
      for (let sequence = 0; sequence <= 10; sequence += 1) {
        const point = points[sequence * 10];
        checkpoints.push({
          stage_id: stage.id,
          sequence,
          label: sequence === 0 ? "Largada" : sequence === 10 ? "Chegada" : `CP ${sequence}`,
          latitude: point[0], longitude: point[1], radius_m: 30, route_progress: sequence * 10,
          checkpoint_kind: sequence === 0 ? "start" : sequence === 10 ? "finish" : "control",
          is_timing_point: true,
        });
      }
    }
    const { data: checkpointRows, error: checkpointError } = await supabase.from("checkpoints").insert(checkpoints).select("id, stage_id, sequence");
    if (checkpointError || !checkpointRows) throw checkpointError ?? new Error("Não foi possível criar os checkpoints.");

    const athleteRows = athletes.map((fullName, index) => {
      const female = index >= 5;
      return {
        full_name: fullName,
        email: `simulacao.${suffix}.${index + 1}@legends.invalid`,
        country_code: "BR",
        category: female ? "Feminino 41+" : "Masculino Master 36–49",
        bib_number: String((female ? 401 : 101) + (female ? index - 5 : index)),
        birth_date: female ? "1980-06-15" : "1985-06-15",
        gender: female ? "female" : "male",
        modality: "gravel_race",
      };
    });
    const { data: athleteData, error: athleteError } = await supabase.from("athletes").insert(athleteRows).select("id, email, full_name, category, bib_number, birth_date, gender");
    if (athleteError || !athleteData) throw athleteError ?? new Error("Não foi possível criar os atletas.");
    athleteIds = athleteData.map((item) => item.id);
    const athleteByEmail = new Map(athleteData.map((item) => [item.email, item]));

    const registrationRows = athleteRows.map((item, index) => ({
      event_id: event.id,
      athlete_id: athleteByEmail.get(item.email)!.id,
      registration_code: `SIM-${suffix.slice(-6)}-${String(index + 1).padStart(2, "0")}`,
      bib_number: item.bib_number,
      full_name: item.full_name,
      email: item.email,
      phone: `550000000${String(index + 1).padStart(2, "0")}`,
      birth_date: item.birth_date,
      gender: item.gender,
      category: item.category,
      modality: "gravel_race",
      country_code: "BR",
      city: "Cidade Simulada",
      location: "Cidade Simulada / BR",
      status: "confirmed",
      source: "manual",
      payment_status: "courtesy",
      registered_at: new Date().toISOString(),
    }));
    const { data: registrations, error: registrationError } = await supabase.from("registrations").insert(registrationRows).select("id, athlete_id, full_name, category, bib_number");
    if (registrationError || !registrations) throw registrationError ?? new Error("Não foi possível criar as inscrições.");

    const registrationsByAthlete = new Map(registrations.map((item) => [item.athlete_id, item]));
    const activities: Array<Record<string, unknown>> = [];
    for (const stage of stages) {
      const points = routePoints(stage.stage_number);
      for (let index = 0; index < athleteData.length; index += 1) {
        const athlete = athleteData[index];
        const movingTime = 3600 + index * 73 + stage.stage_number * 95;
        const fingerprintSubject = `${stage.stage_number}:${index}`;
        activities.push({
          athlete_id: athlete.id,
          stage_id: stage.id,
          source: "gpx",
          source_activity_id: `simulation-${suffix}-${stage.stage_number}-${index + 1}`,
          name: `GPX simulado · Etapa ${stage.stage_number} · ${athlete.full_name}`,
          started_at: `${stage.stage_date}T10:00:00-03:00`,
          distance_km: 3.45,
          elevation_m: 190,
          moving_time_s: movingTime,
          avg_speed_kmh: Number((3.45 / (movingTime / 3600)).toFixed(2)),
          gps_points: points.map((point, pointIndex) => [point[0] + index * .000001, point[1], point[2], pointIndex * movingTime / 100]),
          raw_payload: { fixture: true, generated_gpx: gpxFixture(points, `Atividade ${index + 1}`), registration_id: registrationsByAthlete.get(athlete.id)!.id },
          track_fingerprint: createHash("sha256").update(fingerprintSubject).digest("hex"),
        });
      }
    }
    const { data: activityRows, error: activityError } = await supabase.from("activities").insert(activities).select("id, athlete_id, stage_id, moving_time_s, started_at");
    if (activityError || !activityRows) throw activityError ?? new Error("Não foi possível criar as atividades GPX.");

    // Exercise the production safeguard without persisting an invalid activity.
    // Migration 016 must reject a track already assigned to another athlete in
    // the same stage. If it does not, remove the row and abort the fixture.
    const firstStage = stages.find((stage) => stage.stage_number === 1)!;
    const duplicateFingerprint = createHash("sha256").update("1:8").digest("hex");
    const duplicateOwner = athleteData[9];
    const { data: unexpectedDuplicate, error: duplicateError } = await supabase.from("activities").insert({
      athlete_id: duplicateOwner.id,
      stage_id: firstStage.id,
      source: "gpx",
      source_activity_id: `simulation-${suffix}-duplicate-attempt`,
      name: "GPX duplicado propositalmente para testar a proteção",
      started_at: `${firstStage.stage_date}T10:00:00-03:00`,
      distance_km: 3.45,
      elevation_m: 190,
      moving_time_s: 4300,
      gps_points: routePoints(1),
      raw_payload: { fixture: true, expected_outcome: "blocked_duplicate" },
      track_fingerprint: duplicateFingerprint,
    }).select("id").maybeSingle();
    if (!duplicateError) {
      if (unexpectedDuplicate?.id) await supabase.from("activities").delete().eq("id", unexpectedDuplicate.id);
      throw new Error("A proteção contra GPX duplicado não bloqueou a atividade fictícia.");
    }
    if (duplicateError.code !== "P0001" || !duplicateError.message.includes("já foi utilizada")) throw duplicateError;

    const stageById = new Map(stages.map((item) => [item.id, item]));
    const athleteIndex = new Map(athleteData.map((item, index) => [item.id, index]));
    const validationRows = activityRows.map((activity) => {
      const index = athleteIndex.get(activity.athlete_id)!;
      const stage = stageById.get(activity.stage_id)!;
      const review = stage.stage_number === 1 && index === 7;
      const rejected = stage.stage_number === 2 && index === 8;
      return {
        activity_id: activity.id, stage_id: activity.stage_id,
        status: rejected ? "rejected" : review ? "review" : "validated",
        coverage_percent: rejected ? 72 : review ? 91 : 99,
        start_ok: !rejected, finish_ok: !rejected, direction_ok: true,
        checkpoints_passed: rejected ? 7 : review ? 9 : 11,
        checkpoints_total: 11, max_deviation_m: rejected ? 240 : review ? 48 : 8,
        notes: rejected ? "Simulação: chegada ausente e cobertura insuficiente." : review ? "Simulação: dois checkpoints exigem conferência do comissário." : "Atividade fictícia compatível com a rota oficial.",
        validated_at: new Date().toISOString(),
      };
    });
    const { error: validationError } = await supabase.from("validation_results").insert(validationRows);
    if (validationError) throw validationError;

    const checkpointsByStage = new Map<string, typeof checkpointRows>();
    for (const checkpoint of checkpointRows) {
      const current = checkpointsByStage.get(checkpoint.stage_id) ?? [];
      current.push(checkpoint); checkpointsByStage.set(checkpoint.stage_id, current);
    }
    const passageRows: Array<Record<string, unknown>> = [];
    for (const activity of activityRows) {
      const index = athleteIndex.get(activity.athlete_id)!;
      const stage = stageById.get(activity.stage_id)!;
      const rejected = stage.stage_number === 2 && index === 8;
      for (const checkpoint of (checkpointsByStage.get(activity.stage_id) ?? []).sort((a, b) => a.sequence - b.sequence)) {
        if (rejected && checkpoint.sequence >= 8) continue;
        const elapsed = Number(activity.moving_time_s) * checkpoint.sequence / 10;
        passageRows.push({
          activity_id: activity.id, checkpoint_id: checkpoint.id, point_index: checkpoint.sequence * 10,
          elapsed_s: Number(elapsed.toFixed(3)), activity_distance_m: checkpoint.sequence * 345,
          nearest_distance_m: 2 + index / 10,
          passed_at: new Date(new Date(activity.started_at).getTime() + elapsed * 1000).toISOString(),
        });
      }
    }
    const { error: passageError } = await supabase.from("checkpoint_passages").insert(passageRows);
    if (passageError) throw passageError;

    const resultRows: Array<Record<string, unknown>> = [];
    for (const activity of activityRows) {
      const index = athleteIndex.get(activity.athlete_id)!;
      const stage = stageById.get(activity.stage_id)!;
      const rejected = stage.stage_number === 2 && index === 8;
      if (rejected) continue;
      const review = stage.stage_number === 1 && index === 7;
      const categoryIndex = index < 5 ? index : index - 5;
      const position = review ? null : categoryIndex + 1 - (stage.stage_number === 2 && index === 9 ? 1 : 0);
      const penalty = stage.stage_number === 2 && index === 4;
      const registration = registrationsByAthlete.get(activity.athlete_id)!;
      const base = position ? basePoints[position - 1] ?? 0 : 0;
      resultRows.push({
        event_id: event.id, stage_id: activity.stage_id, athlete_id: activity.athlete_id,
        registration_id: registration.id, activity_id: activity.id, full_name: registration.full_name,
        bib_number: registration.bib_number, category: registration.category, modality: "gravel_race",
        official_time_s: activity.moving_time_s, time_penalty_s: penalty ? 60 : 0,
        points_penalty: penalty ? 10 : 0, final_time_s: Number(activity.moving_time_s) + (penalty ? 60 : 0),
        position, base_points: base, weighted_points: Math.max(0, base * (stage.stage_number === 2 ? 4 : 1) - (penalty ? 10 : 0)),
        status: review ? "review" : "provisional",
        integrity_status: "clean",
        admin_note: penalty ? "Simulação: penalidade de 1 minuto e 10 pontos." : review ? "Simulação: decisão do comissário pendente." : null,
      });
    }
    const { error: resultError } = await supabase.from("stage_results").insert(resultRows);
    if (resultError) throw resultError;

    await recordAdminAudit(request, {
      action: "simulation.created", resourceType: "event", resourceId: event.id, eventId: event.id,
      details: { athletes: 10, stages: 2, activities: activityRows.length, checkpoints: checkpointRows.length, results: resultRows.length, duplicate_attempt_blocked: true },
    });
    return NextResponse.json({
      event, summary: { athletes: 10, stages: 2, route_gpx: 2, checkpoints: checkpointRows.length, activities: activityRows.length, validations: validationRows.length, results: resultRows.length, pending_reviews: 1, rejected: 1, duplicate_attempts_blocked: 1, penalties: 1 },
    }, { status: 201 });
  } catch (error) {
    if (eventId) await supabase.from("events").delete().eq("id", eventId);
    if (athleteIds.length) await supabase.from("athletes").delete().in("id", athleteIds);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar a simulação." }, { status: 500 });
  }
}
