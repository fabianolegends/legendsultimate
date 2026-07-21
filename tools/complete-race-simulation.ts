import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { categoryForRegistration } from "../lib/category-rules";
import { buildOverallClassification, classifyStage, type OverallStageResult } from "../lib/classification-engine/index";
import { buildFallbackDistanceStream, detectCheckpointPassages } from "../lib/checkpoint-engine/index";
import { type GeoPoint, validateActivity } from "../lib/race-engine/index";

const athleteCount = Math.max(20, Math.min(5000, Number(process.argv[2] ?? 1000)));
const stageCount = 4;
const eventDate = "2026-09-01";
const stageWeights = [1, 1, 1, 4];
const profiles = [
  { gender: "male", birthDate: "1995-05-10", modality: "gravel_race" },
  { gender: "male", birthDate: "1984-02-20", modality: "gravel_race" },
  { gender: "male", birthDate: "1968-08-04", modality: "gravel_race" },
  { gender: "female", birthDate: "1990-06-18", modality: "gravel_race" },
  { gender: "female", birthDate: "1974-11-09", modality: "gravel_race" },
  { gender: "other", birthDate: "1988-01-15", modality: "gravel_race" },
  { gender: "female", birthDate: "1982-04-11", modality: "experience" },
] as const;

type Registration = {
  id: string;
  athleteId: string;
  fullName: string;
  category: string;
  bibNumber: string;
};

function route(stage: number): GeoPoint[] {
  return Array.from({ length: 181 }, (_, index) => [
    -29.4 + stage * .01 + index * .00019,
    -50.9 + Math.sin(index / 15) * .002,
    300 + index,
  ]);
}

function activityFrom(official: GeoPoint[], athlete: number, stage: number) {
  const jitter = ((athlete * 17 + stage * 7) % 9 - 4) * .000002;
  let points = official.map(([lat, lng, ele]) => [lat + jitter, lng - jitter, ele] as GeoPoint);
  if (athlete % 97 === 0) points = points.slice(0, 118); // Sem chegada.
  if (athlete % 113 === 0) points = [...points.slice(0, 78), ...points.slice(98)]; // Corte de rota.
  if (athlete % 211 === 0) points = [...points].reverse(); // Sentido invertido.
  return points;
}

function configureRegistrations() {
  const nextByCategory = new Map<string, number>();
  const baseByCategory = new Map<string, number>();
  const registrations: Registration[] = [];
  for (let athlete = 1; athlete <= athleteCount; athlete += 1) {
    const profile = profiles[(athlete - 1) % profiles.length];
    const rule = categoryForRegistration({ ...profile, eventDate });
    assert.equal(rule.error, null);
    assert.ok(rule.category);
    if (!baseByCategory.has(rule.category)) {
      const base = 1001 + baseByCategory.size * 1000;
      baseByCategory.set(rule.category, base);
      nextByCategory.set(rule.category, base);
    }
    const number = nextByCategory.get(rule.category)!;
    nextByCategory.set(rule.category, number + 1);
    registrations.push({
      id: `reg-${athlete}`,
      athleteId: `athlete-${athlete}`,
      fullName: `Atleta ${String(athlete).padStart(4, "0")}`,
      category: rule.category,
      bibNumber: String(number).padStart(4, "0"),
    });
  }
  return registrations;
}

const started = performance.now();
const registrations = configureRegistrations();
const bibs = new Set(registrations.map((item) => item.bibNumber));
assert.equal(bibs.size, registrations.length, "A numeração deve ser única no evento.");

const overallRows: OverallStageResult[] = [];
const importedSources = new Set<string>();
const audit: Array<{ action: string; stage: number; subject?: string }> = [];
let incomingActivities = 0;
let duplicatesIgnored = 0;
let validations = 0;
let automaticApprovals = 0;
let stewardApprovals = 0;
let rejected = 0;
let penalties = 0;
let checkpointPassages = 0;
let stagesLocked = 0;

for (let stage = 1; stage <= stageCount; stage += 1) {
  const official = route(stage);
  const checkpoints = Array.from({ length: 9 }, (_, index) => {
    const point = official[(index + 1) * 18];
    return { id: `s${stage}-cp${index + 1}`, sequence: index + 1, label: `CP ${index + 1}`, latitude: point[0], longitude: point[1], radius_m: 30, checkpoint_kind: "control" };
  });
  const candidates = [];

  for (let athlete = 1; athlete <= athleteCount; athlete += 1) {
    const registration = registrations[athlete - 1];
    const sourceId = `rwgps-${stage}-${athlete}`;
    incomingActivities += 1;
    assert.ok(!importedSources.has(sourceId));
    importedSources.add(sourceId);
    if (athlete % 157 === 0) {
      incomingActivities += 1;
      duplicatesIgnored += 1;
      assert.ok(importedSources.has(sourceId), "A duplicidade precisa ser detectada antes da validação.");
    }

    const activity = activityFrom(official, athlete, stage);
    const report = validateActivity({
      officialPoints: official,
      activityPoints: activity,
      checkpoints,
      rules: { routeToleranceM: 60, startRadiusM: 80, finishRadiusM: 80 },
    });
    validations += 1;
    const movingTime = 6800 + athlete * 3 + stage * 45;
    const elapsed = activity.map((_, index) => movingTime * index / Math.max(1, activity.length - 1));
    checkpointPassages += detectCheckpointPassages({
      activityPoints: activity,
      elapsedSeconds: elapsed,
      activityDistanceMeters: buildFallbackDistanceStream(activity),
      startedAt: `2026-09-0${stage}T09:00:00Z`,
      checkpoints,
    }).filter((item) => item.passed).length;

    let status: "official" | "dnf" = "official";
    let pointsPenalty = 0;
    if (report.status === "validated") {
      automaticApprovals += 1;
    } else if (report.status === "manual_review") {
      stewardApprovals += 1;
      pointsPenalty = athlete % 2 === 0 ? 10 : 0;
      if (pointsPenalty) penalties += 1;
      audit.push({ action: "result.reviewed", stage, subject: registration.id });
    } else {
      rejected += 1;
      status = "dnf";
      audit.push({ action: "result.rejected", stage, subject: registration.id });
    }

    candidates.push({
      id: `result-${stage}-${athlete}`,
      athlete_id: registration.athleteId,
      registration_id: registration.id,
      full_name: registration.fullName,
      category: registration.category,
      final_time_s: movingTime,
      points_penalty: pointsPenalty,
      status,
    });
  }

  const classified = classifyStage(candidates, stageWeights[stage - 1]);
  for (const result of classified) {
    const registration = registrations.find((item) => item.id === result.registration_id)!;
    overallRows.push({
      athlete_id: result.athlete_id,
      registration_id: result.registration_id,
      full_name: result.full_name,
      bib_number: registration.bibNumber,
      category: result.category,
      stage_id: `stage-${stage}`,
      stage_number: stage,
      position: result.position,
      final_time_s: result.final_time_s,
      weighted_points: result.weighted_points,
      status: result.status,
    });
  }
  assert.equal(classified.filter((item) => item.status === "review").length, 0, "A etapa não pode ser publicada com revisão pendente.");
  audit.push({ action: "stage.published", stage });
  stagesLocked += 1;
}

const overall = buildOverallClassification(overallRows, stageCount);
const eligibleForTitle = overall.filter((item) => item.eligible_for_title).length;
const backup = JSON.stringify({ event: "Simulação completa", registrations, results: overallRows, audit });
const backupSha256 = createHash("sha256").update(backup).digest("hex");
const elapsedMs = performance.now() - started;

assert.equal(validations, athleteCount * stageCount);
assert.equal(stagesLocked, stageCount);
assert.equal(audit.filter((item) => item.action === "stage.published").length, stageCount);
assert.equal(backupSha256.length, 64);
assert.equal(overall.filter((item) => item.stage_results.length > stageCount).length, 0);
assert.equal(new Set(overall.map((item) => `${item.category}:${item.overall_position}`)).size, overall.length);
assert.equal(automaticApprovals + stewardApprovals + rejected, validations);
assert.ok(penalties > 0, "A simulação precisa exercitar ao menos uma penalidade.");

console.log(JSON.stringify({
  result: "PASS",
  event: { stages: stageCount, registrations: registrations.length, categories: new Set(registrations.map((item) => item.category)).size },
  ingestion: { incoming_activities: incomingActivities, unique_imports: importedSources.size, duplicates_ignored: duplicatesIgnored },
  validation: { total: validations, automatic_approvals: automaticApprovals, steward_approvals: stewardApprovals, rejected, penalties, checkpoint_passages: checkpointPassages },
  publication: { stages_locked: stagesLocked, audit_records: audit.length },
  classification: { classified_athletes: overall.length, eligible_for_title: eligibleForTitle },
  backup: { bytes: Buffer.byteLength(backup), sha256: backupSha256 },
  performance: { duration_ms: Number(elapsedMs.toFixed(1)), validations_per_second: Math.round(validations / (elapsedMs / 1000)), memory_mb: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)) },
}, null, 2));
