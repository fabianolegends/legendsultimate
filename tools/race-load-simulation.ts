import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { buildOverallClassification, classifyStage, type OverallStageResult } from "../lib/classification-engine/index";
import { detectCheckpointPassages } from "../lib/checkpoint-engine/index";
import { type GeoPoint, validateActivity } from "../lib/race-engine/index";

const athleteCount = Math.max(10, Math.min(5000, Number(process.argv[2] ?? 500)));
const stageCount = 4;
const stageWeights = [1.15, 1, 1.2, .65];
const categories = ["Masculino Master 36–49", "Masculino 50+", "Feminino 18–40", "Feminino 41+", "Livre"];

function route(stage: number): GeoPoint[] {
  return Array.from({ length: 121 }, (_, index) => [-29.4 + stage * .01 + index * .00025, -50.9 + Math.sin(index / 12) * .002, 300 + index]);
}
function activityFrom(official: GeoPoint[], athlete: number, stage: number) {
  const jitter = ((athlete * 17 + stage * 7) % 9 - 4) * .000002;
  return official.map(([lat, lng, ele]) => [lat + jitter, lng - jitter, ele] as GeoPoint);
}

const started = performance.now();
const overallRows: OverallStageResult[] = [];
let validations = 0;
let checkpointPassages = 0;
let reviews = 0;
let rejected = 0;

for (let stage = 1; stage <= stageCount; stage += 1) {
  const official = route(stage);
  const checkpoints = Array.from({ length: 9 }, (_, index) => {
    const point = official[(index + 1) * 12];
    return { id: `s${stage}-cp${index + 1}`, sequence: index + 1, label: `CP ${index + 1}`, latitude: point[0], longitude: point[1], radius_m: 30, checkpoint_kind: "control" };
  });
  const candidates = [];
  for (let athlete = 1; athlete <= athleteCount; athlete += 1) {
    let activity = activityFrom(official, athlete, stage);
    if (athlete % 97 === 0) activity = activity.slice(0, 78);
    if (athlete % 113 === 0) activity = [...activity.slice(0, 55), ...activity.slice(65)];
    const report = validateActivity({ officialPoints: official, activityPoints: activity, checkpoints, rules: { routeToleranceM: 60, startRadiusM: 80, finishRadiusM: 80 } });
    validations += 1;
    if (report.status === "manual_review") reviews += 1;
    if (report.status === "rejected") rejected += 1;
    const movingTime = 6800 + athlete * 3 + stage * 45;
    const elapsed = activity.map((_, index) => movingTime * index / Math.max(1, activity.length - 1));
    const distances = activity.map((_, index) => index * 250);
    checkpointPassages += detectCheckpointPassages({ activityPoints: activity, elapsedSeconds: elapsed, activityDistanceMeters: distances, startedAt: "2026-09-01T09:00:00Z", checkpoints }).filter(item => item.passed).length;
    candidates.push({ id: `r-${stage}-${athlete}`, athlete_id: `a-${athlete}`, registration_id: `reg-${athlete}`, full_name: `Atleta ${String(athlete).padStart(4, "0")}`, category: categories[athlete % categories.length], final_time_s: movingTime, points_penalty: athlete % 89 === 0 ? 10 : 0, status: report.status === "rejected" ? "dnf" : "provisional" });
  }
  const classified = classifyStage(candidates, stageWeights[stage - 1]);
  for (const result of classified) overallRows.push({ athlete_id: result.athlete_id, registration_id: result.registration_id, full_name: result.full_name, bib_number: String(Number(result.athlete_id.slice(2)) + 100), category: result.category, stage_id: `stage-${stage}`, stage_number: stage, position: result.position, final_time_s: result.final_time_s, weighted_points: result.weighted_points, status: result.status });
}

const overall = buildOverallClassification(overallRows, stageCount);
const elapsedMs = performance.now() - started;
const eligible = overall.filter(item => item.eligible_for_title).length;
assert.equal(validations, athleteCount * stageCount);
assert.ok(overall.length <= athleteCount);
assert.ok(overall.every(item => item.stage_results.length <= stageCount));
assert.ok(new Set(overall.map(item => `${item.category}:${item.overall_position}`)).size === overall.length);

console.log(JSON.stringify({
  result: "PASS",
  synthetic_athletes: athleteCount,
  stages: stageCount,
  validations,
  checkpoint_passages: checkpointPassages,
  manual_reviews: reviews,
  rejected,
  classified_athletes: overall.length,
  eligible_for_title: eligible,
  duration_ms: Number(elapsedMs.toFixed(1)),
  validations_per_second: Math.round(validations / (elapsedMs / 1000)),
  memory_mb: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)),
}, null, 2));
