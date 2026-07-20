import assert from "node:assert/strict";
import test from "node:test";
import { type GeoPoint, validateActivity } from "./index";

function line(start: [number, number], finish: [number, number], count = 101): GeoPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    return [
      start[0] + (finish[0] - start[0]) * progress,
      start[1] + (finish[1] - start[1]) * progress,
      null,
    ];
  });
}

const east = line([-29.30, -50.90], [-29.30, -50.80]);
const north = line([-29.30, -50.80], [-29.20, -50.80]).slice(1);
const official = [...east, ...north];

test("homologa uma atividade que percorre a rota completa no sentido oficial", () => {
  const report = validateActivity({ officialPoints: official, activityPoints: official, checkpoints: [], toleranceM: 80 });
  assert.equal(report.status, "validated");
  assert.equal(report.direction_ok, true);
  assert.equal(report.shortcut_suspected, false);
  assert.ok(report.coverage_percent >= 99);
  assert.ok(report.forward_progress_percent >= 99);
});

test("rejeita a mesma rota percorrida no sentido inverso", () => {
  const report = validateActivity({ officialPoints: official, activityPoints: [...official].reverse(), checkpoints: [], toleranceM: 80 });
  assert.equal(report.status, "rejected");
  assert.equal(report.direction_ok, false);
  assert.ok(report.forward_progress_percent < 30);
});

test("detecta um corte diagonal entre a largada e a chegada", () => {
  const diagonal = line(official[0] as [number, number], official[official.length - 1] as [number, number]);
  const report = validateActivity({ officialPoints: official, activityPoints: diagonal, checkpoints: [], toleranceM: 80 });
  assert.notEqual(report.status, "validated");
  assert.equal(report.shortcut_suspected, true);
  assert.ok(report.coverage_percent < 92);
});

test("encaminha para revisão quando há trecho contínuo relevante fora da rota", () => {
  const detour = [
    ...east.slice(0, 45),
    ...line(east[44] as [number, number], [-29.285, -50.845], 20).slice(1),
    ...line([-29.285, -50.845], east[60] as [number, number], 20).slice(1),
    ...east.slice(61),
    ...north,
  ];
  const report = validateActivity({ officialPoints: official, activityPoints: detour, checkpoints: [], toleranceM: 80 });
  assert.notEqual(report.status, "validated");
  assert.ok(report.off_route_percent > 0);
  assert.ok(report.max_deviation_m > 80);
});
