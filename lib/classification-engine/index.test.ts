import assert from "node:assert/strict";
import test from "node:test";
import { buildOverallClassification, classifyStage, type OverallStageResult } from "./index";

test("aplica a fórmula proporcional oficial e o coeficiente da etapa", () => {
  const result = classifyStage([
    { id: "a", athlete_id: "a", full_name: "A", category: "Master", final_time_s: 3_600, status: "provisional" },
    { id: "b", athlete_id: "b", full_name: "B", category: "Master", final_time_s: 4_500, status: "provisional" },
    { id: "c", athlete_id: "c", full_name: "C", category: "Master", final_time_s: 7_200, status: "provisional" },
  ], 1.15);

  assert.deepEqual(result.map((item) => item.base_points), [100, 80, 50]);
  assert.deepEqual(result.map((item) => item.weighted_points), [115, 92, 57.5]);
});

test("limita os vencedores das quatro etapas a 115, 100, 120 e 65 pontos", () => {
  const candidate = [
    { id: "a", athlete_id: "a", full_name: "A", category: "Open", final_time_s: 3_600, status: "official" },
  ];

  assert.deepEqual(
    [1.15, 1, 1.2, .65].map((coefficient) => classifyStage(candidate, coefficient)[0].weighted_points),
    [115, 100, 120, 65],
  );
});

test("usa o melhor tempo válido de cada categoria como referência independente", () => {
  const result = classifyStage([
    { id: "open-a", athlete_id: "open-a", full_name: "Open A", category: "Open", final_time_s: 3_600, status: "official" },
    { id: "open-b", athlete_id: "open-b", full_name: "Open B", category: "Open", final_time_s: 7_200, status: "official" },
    { id: "master-a", athlete_id: "master-a", full_name: "Master A", category: "Master", final_time_s: 4_000, status: "official" },
  ], 1);

  assert.equal(result.find((item) => item.id === "open-a")?.weighted_points, 100);
  assert.equal(result.find((item) => item.id === "open-b")?.weighted_points, 50);
  assert.equal(result.find((item) => item.id === "master-a")?.weighted_points, 100);
});

test("mantém duas casas decimais e desconta a penalidade após o coeficiente", () => {
  const result = classifyStage([
    { id: "a", athlete_id: "a", full_name: "A", category: "Open", final_time_s: 3_600, status: "official" },
    { id: "b", athlete_id: "b", full_name: "B", category: "Open", final_time_s: 3_780, points_penalty: 10, status: "official" },
  ], 1.15);

  assert.equal(result[1].base_points, 95.24);
  assert.equal(result[1].weighted_points, 99.52);
});

test("não pontua revisão, desclassificado, tempo inválido ou atleta fora do limite", () => {
  const result = classifyStage([
    { id: "a", athlete_id: "a", full_name: "A", category: "Open", final_time_s: 100, status: "review" },
    { id: "b", athlete_id: "b", full_name: "B", category: "Open", final_time_s: 200, status: "disqualified" },
    { id: "c", athlete_id: "c", full_name: "C", category: "Open", final_time_s: 301, status: "provisional" },
    { id: "d", athlete_id: "d", full_name: "D", category: "Open", final_time_s: 0, status: "official" },
  ], 1, 300);

  assert.deepEqual(result.map((item) => item.weighted_points), [0, 0, 0, 0]);
  assert.equal(result.find((item) => item.id === "c")?.status, "dnf");
  assert.equal(result.find((item) => item.id === "d")?.status, "review");
});

test("atribui a mesma posição a tempos finais idênticos", () => {
  const result = classifyStage([
    { id: "a", athlete_id: "a", full_name: "A", category: "Open", final_time_s: 100, status: "official" },
    { id: "b", athlete_id: "b", full_name: "B", category: "Open", final_time_s: 100, status: "official" },
    { id: "c", athlete_id: "c", full_name: "C", category: "Open", final_time_s: 110, status: "official" },
  ], 1);

  assert.deepEqual(result.map((item) => item.position), [1, 1, 3]);
});

test("rejeita coeficiente de etapa inválido", () => {
  assert.throws(() => classifyStage([], 0), /maior que zero/);
});

function row(
  athlete: string,
  stageNumber: number,
  weightedPoints: number,
  position: number,
  finalTimeS: number,
  journeyFormat: "ultimate" | "short" = "ultimate",
): OverallStageResult {
  return {
    athlete_id: athlete,
    registration_id: `reg-${athlete}`,
    full_name: `Atleta ${athlete}`,
    category: "Master",
    journey_format: journeyFormat,
    stage_id: `s${stageNumber}`,
    stage_number: stageNumber,
    position,
    final_time_s: finalTimeS,
    weighted_points: weightedPoints,
    status: "official",
  };
}

test("classificação geral soma pontos e exige todas as etapas homologadas", () => {
  const overall = buildOverallClassification([
    row("a", 1, 115, 1, 100),
    row("a", 2, 85, 2, 110),
    row("b", 1, 109.52, 2, 105),
  ], 2);

  assert.equal(overall[0].full_name, "Atleta a");
  assert.equal(overall[0].total_points, 200);
  assert.equal(overall[0].eligible_for_title, true);
  assert.equal(overall[1].eligible_for_title, false);
});

test("desempata primeiro pelo maior número de vitórias", () => {
  const overall = buildOverallClassification([
    row("a", 1, 100, 1, 100), row("a", 2, 100, 1, 100), row("a", 3, 100, 2, 100), row("a", 4, 100, 2, 100),
    row("b", 1, 100, 1, 100), row("b", 2, 100, 2, 100), row("b", 3, 100, 2, 100), row("b", 4, 100, 2, 100),
  ], 4);

  assert.equal(overall[0].athlete_id, "a");
});

test("depois das vitórias, desempata pela melhor pontuação na Stage 03", () => {
  const overall = buildOverallClassification([
    row("a", 1, 110, 1, 100), row("a", 2, 90, 2, 100), row("a", 3, 110, 2, 100), row("a", 4, 90, 2, 100),
    row("b", 1, 110, 1, 100), row("b", 2, 100, 2, 100), row("b", 3, 100, 2, 100), row("b", 4, 90, 2, 100),
  ], 4);

  assert.equal(overall[0].athlete_id, "a");
  assert.equal(overall[0].stage3_points, 110);
});

test("depois da Stage 03, desempata pela menor soma dos tempos válidos", () => {
  const overall = buildOverallClassification([
    row("a", 1, 100, 1, 90), row("a", 2, 100, 2, 90), row("a", 3, 100, 2, 90), row("a", 4, 100, 2, 90),
    row("b", 1, 100, 1, 100), row("b", 2, 100, 2, 100), row("b", 3, 100, 2, 100), row("b", 4, 100, 2, 100),
  ], 4);

  assert.equal(overall[0].athlete_id, "a");
  assert.equal(overall[0].total_valid_time_s, 360);
});

test("por último, desempata pela melhor classificação na Stage 04", () => {
  const overall = buildOverallClassification([
    row("a", 1, 100, 1, 100), row("a", 2, 100, 2, 100), row("a", 3, 100, 2, 100), row("a", 4, 100, 2, 100),
    row("b", 1, 100, 1, 100), row("b", 2, 100, 2, 100), row("b", 3, 100, 2, 100), row("b", 4, 100, 3, 100),
  ], 4);

  assert.equal(overall[0].athlete_id, "a");
  assert.equal(overall[0].stage4_position, 2);
});

test("mantém colocação compartilhada quando todos os critérios continuam iguais", () => {
  const overall = buildOverallClassification([
    row("a", 1, 100, 1, 100), row("a", 2, 100, 2, 100), row("a", 3, 100, 2, 100), row("a", 4, 100, 2, 100),
    row("b", 1, 100, 1, 100), row("b", 2, 100, 2, 100), row("b", 3, 100, 2, 100), row("b", 4, 100, 2, 100),
  ], 4);

  assert.deepEqual(overall.map((item) => item.overall_position), [1, 1]);
  assert.ok(overall.every((item) => item.shared_position));
});

test("mantém rankings independentes para Ultimate e Short na mesma categoria", () => {
  const stage = classifyStage([
    { id: "ultimate", athlete_id: "u", full_name: "Ultimate", category: "Open", journey_format: "ultimate", final_time_s: 100, status: "official" },
    { id: "short", athlete_id: "s", full_name: "Short", category: "Open", journey_format: "short", final_time_s: 200, status: "official" },
  ], 1);

  assert.deepEqual(stage.map((item) => item.weighted_points), [100, 100]);
  assert.deepEqual(stage.map((item) => item.position), [1, 1]);
});

test("Short exige apenas as Stages 03 e 04 enquanto Ultimate exige as quatro etapas", () => {
  const overall = buildOverallClassification([
    row("u", 1, 115, 1, 100), row("u", 2, 100, 1, 100), row("u", 3, 120, 1, 100), row("u", 4, 65, 1, 100),
    row("s", 3, 120, 1, 100, "short"), row("s", 4, 65, 1, 100, "short"),
  ], 4, { ultimate: [1, 2, 3, 4], short: [3, 4] });

  const ultimate = overall.find((item) => item.journey_format === "ultimate");
  const short = overall.find((item) => item.journey_format === "short");
  assert.equal(ultimate?.eligible_for_title, true);
  assert.equal(ultimate?.total_points, 400);
  assert.equal(short?.eligible_for_title, true);
  assert.equal(short?.total_points, 185);
  assert.equal(short?.stages_completed, 2);
});

test("não mistura o mesmo atleta quando há resultados sem registration_id nos dois formatos", () => {
  const ultimate = { ...row("mesmo", 3, 120, 1, 100), registration_id: null };
  const short = { ...row("mesmo", 3, 120, 1, 100, "short"), registration_id: null };
  const overall = buildOverallClassification([ultimate, short], 4, { ultimate: [1, 2, 3, 4], short: [3, 4] });

  assert.equal(overall.length, 2);
  assert.deepEqual(new Set(overall.map((item) => item.journey_format)), new Set(["ultimate", "short"]));
});
