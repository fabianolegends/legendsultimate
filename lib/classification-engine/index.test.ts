import assert from "node:assert/strict";
import test from "node:test";
import { buildOverallClassification, classifyStage } from "./index";

test("aplica a tabela oficial e o peso da etapa", () => {
  const candidates = Array.from({ length: 11 }, (_, index) => ({
    id: String(index), athlete_id: String(index), full_name: `Atleta ${index}`, category: "Master",
    final_time_s: 3600 + index, status: "provisional",
  }));
  const result = classifyStage(candidates, 1.15);
  assert.deepEqual(result.slice(0, 3).map((item) => item.weighted_points), [115, 98, 83]);
  assert.equal(result[9].weighted_points, 25);
  assert.equal(result[10].weighted_points, 0);
});

test("não pontua revisão, desclassificado ou atleta fora do tempo limite", () => {
  const result = classifyStage([
    { id: "a", athlete_id: "a", full_name: "A", category: "Open", final_time_s: 100, status: "review" },
    { id: "b", athlete_id: "b", full_name: "B", category: "Open", final_time_s: 200, status: "disqualified" },
    { id: "c", athlete_id: "c", full_name: "C", category: "Open", final_time_s: 301, status: "provisional" },
  ], 1, 300);
  assert.deepEqual(result.map((item) => item.weighted_points), [0, 0, 0]);
  assert.equal(result.find((item) => item.id === "c")?.status, "dnf");
});

test("classificação geral soma pontos e exige todas as etapas", () => {
  const overall = buildOverallClassification([
    { athlete_id: "a", full_name: "A", category: "Master", stage_id: "s1", stage_number: 1, position: 1, final_time_s: 100, weighted_points: 115, status: "official" },
    { athlete_id: "a", full_name: "A", category: "Master", stage_id: "s2", stage_number: 2, position: 2, final_time_s: 110, weighted_points: 85, status: "official" },
    { athlete_id: "b", full_name: "B", category: "Master", stage_id: "s1", stage_number: 1, position: 2, final_time_s: 105, weighted_points: 98, status: "official" },
  ], 2);
  assert.equal(overall[0].full_name, "A");
  assert.equal(overall[0].total_points, 200);
  assert.equal(overall[0].eligible_for_title, true);
  assert.equal(overall[1].eligible_for_title, false);
});
