export type GeoPoint = [number, number, number | null];

export type CheckpointInput = {
  id?: string;
  sequence: number;
  label: string;
  latitude: number;
  longitude: number;
  radius_m: number;
};

export type ValidationRules = {
  routeToleranceM?: number;
  startRadiusM?: number;
  finishRadiusM?: number;
  directionRequired?: boolean;
  autoValidateMinCoverage?: number;
  reviewMinCoverage?: number;
  autoValidateMaxOffRoutePercent?: number;
  reviewMaxOffRoutePercent?: number;
  maxContinuousOffRouteKm?: number;
  autoValidateMinCheckpointRatio?: number;
  reviewMinCheckpointRatio?: number;
};

export type ValidationReport = {
  status: "validated" | "manual_review" | "rejected";
  coverage_percent: number;
  matched_route_km: number;
  route_distance_km: number;
  activity_distance_km: number;
  start_ok: boolean;
  finish_ok: boolean;
  direction_ok: boolean;
  forward_progress_percent: number;
  off_route_percent: number;
  longest_off_route_km: number;
  max_deviation_m: number;
  shortcut_suspected: boolean;
  checkpoints_hit: number;
  checkpoints_total: number;
  checkpoint_results: Array<CheckpointInput & { hit: boolean; nearest_distance_m: number }>;
  tolerance_m: number;
  notes: string[];
};

const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: GeoPoint, b: GeoPoint) {
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(value)));
}

export function parseGpx(xml: string): GeoPoint[] {
  const pointRegex = /<(?:trkpt|rtept)\b[^>]*lat=["']([^"']+)["'][^>]*lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:trkpt|rtept)>/gi;
  const points: GeoPoint[] = [];
  let match: RegExpExecArray | null;

  while ((match = pointRegex.exec(xml))) {
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    const elevationMatch = match[3].match(/<ele>([^<]+)<\/ele>/i);
    const elevation = elevationMatch ? Number(elevationMatch[1]) : null;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      points.push([lat, lng, Number.isFinite(elevation) ? elevation : null]);
    }
  }

  if (points.length < 2) throw new Error("O GPX da atividade não contém pontos suficientes.");
  return points;
}

export function polylineDistanceKm(points: GeoPoint[]) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distanceKm(points[index - 1], points[index]);
  }
  return total;
}

function nearestDistanceM(point: GeoPoint, candidates: GeoPoint[]) {
  let nearest = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const meters = distanceKm(point, candidate) * 1000;
    if (meters < nearest) nearest = meters;
    if (nearest < 8) break;
  }
  return nearest;
}

function nearestPoint(point: GeoPoint, candidates: GeoPoint[]) {
  let distanceM = Number.POSITIVE_INFINITY;
  let index = 0;
  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
    const meters = distanceKm(point, candidates[candidateIndex]) * 1000;
    if (meters < distanceM) {
      distanceM = meters;
      index = candidateIndex;
    }
    if (distanceM < 8) break;
  }
  return { distanceM, index };
}

function samplePoints(points: GeoPoint[], maxPoints = 900) {
  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => points[Math.round(index * step)]);
}

function cumulativeDistances(points: GeoPoint[]) {
  const distances = [0];
  for (let index = 1; index < points.length; index += 1) {
    distances.push(distances[index - 1] + distanceKm(points[index - 1], points[index]));
  }
  return distances;
}

function routeCoverage(official: GeoPoint[], activity: GeoPoint[], toleranceM: number) {
  let matchedKm = 0;
  let routeKm = 0;
  for (let index = 1; index < official.length; index += 1) {
    const segmentKm = distanceKm(official[index - 1], official[index]);
    routeKm += segmentKm;
    const midpoint: GeoPoint = [
      (official[index - 1][0] + official[index][0]) / 2,
      (official[index - 1][1] + official[index][1]) / 2,
      null,
    ];
    if (nearestDistanceM(midpoint, activity) <= toleranceM) matchedKm += segmentKm;
  }
  return { matchedKm, routeKm, percent: routeKm ? (matchedKm / routeKm) * 100 : 0 };
}

function analyzeActivityProgress(official: GeoPoint[], activity: GeoPoint[], toleranceM: number) {
  const routeProgress = cumulativeDistances(official);
  const matches = activity.map((point) => nearestPoint(point, official));
  let forwardKm = 0;
  let backwardKm = 0;
  let offRouteKm = 0;
  let longestOffRouteKm = 0;
  let currentOffRouteKm = 0;
  let maxDeviationM = 0;

  for (let index = 0; index < matches.length; index += 1) {
    maxDeviationM = Math.max(maxDeviationM, matches[index].distanceM);
    if (index === 0) continue;
    const activitySegmentKm = distanceKm(activity[index - 1], activity[index]);
    const outside = matches[index - 1].distanceM > toleranceM && matches[index].distanceM > toleranceM;
    if (outside) {
      offRouteKm += activitySegmentKm;
      currentOffRouteKm += activitySegmentKm;
      longestOffRouteKm = Math.max(longestOffRouteKm, currentOffRouteKm);
    } else {
      currentOffRouteKm = 0;
    }

    if (matches[index - 1].distanceM > toleranceM * 1.5 || matches[index].distanceM > toleranceM * 1.5) continue;
    const delta = routeProgress[matches[index].index] - routeProgress[matches[index - 1].index];
    // Ignore large projection jumps caused by crossings or parallel portions of a route.
    if (Math.abs(delta) > Math.max(2, activitySegmentKm * 8)) continue;
    if (delta > 0.02) forwardKm += delta;
    if (delta < -0.02) backwardKm += Math.abs(delta);
  }

  const directionalKm = forwardKm + backwardKm;
  const activityKm = polylineDistanceKm(activity);
  return {
    forwardPercent: directionalKm ? (forwardKm / directionalKm) * 100 : 100,
    offRoutePercent: activityKm ? (offRouteKm / activityKm) * 100 : 0,
    longestOffRouteKm,
    maxDeviationM,
  };
}

export function validateActivity(input: {
  officialPoints: GeoPoint[];
  activityPoints: GeoPoint[];
  checkpoints: CheckpointInput[];
  toleranceM?: number;
  rules?: ValidationRules;
}): ValidationReport {
  const toleranceM = input.rules?.routeToleranceM ?? input.toleranceM ?? 120;
  const autoCoverage = input.rules?.autoValidateMinCoverage ?? 95;
  const reviewCoverage = input.rules?.reviewMinCoverage ?? 80;
  const autoMaxOffRoute = input.rules?.autoValidateMaxOffRoutePercent ?? 5;
  const reviewMaxOffRoute = input.rules?.reviewMaxOffRoutePercent ?? 20;
  const maxContinuousOffRouteKm = input.rules?.maxContinuousOffRouteKm ?? 1.5;
  const autoCheckpointRatio = input.rules?.autoValidateMinCheckpointRatio ?? 0.95;
  const reviewCheckpointRatio = input.rules?.reviewMinCheckpointRatio ?? 0.8;
  const directionRequired = input.rules?.directionRequired ?? true;
  const official = samplePoints(input.officialPoints);
  const activity = samplePoints(input.activityPoints, 1400);

  const routeDistance = polylineDistanceKm(input.officialPoints);
  const activityDistance = polylineDistanceKm(input.activityPoints);
  const coverageResult = routeCoverage(official, activity, toleranceM);
  const coverage = coverageResult.percent;
  const progress = analyzeActivityProgress(official, activity, toleranceM);

  const startDistance = nearestDistanceM(input.officialPoints[0], activity);
  const finishDistance = nearestDistanceM(input.officialPoints[input.officialPoints.length - 1], activity);
  const startOk = startDistance <= (input.rules?.startRadiusM ?? Math.max(toleranceM, 180));
  const finishOk = finishDistance <= (input.rules?.finishRadiusM ?? Math.max(toleranceM, 180));

  const directStart = distanceKm(input.officialPoints[0], input.activityPoints[0]);
  const directFinish = distanceKm(
    input.officialPoints[input.officialPoints.length - 1],
    input.activityPoints[input.activityPoints.length - 1],
  );
  const reverseStart = distanceKm(input.officialPoints[0], input.activityPoints[input.activityPoints.length - 1]);
  const reverseFinish = distanceKm(
    input.officialPoints[input.officialPoints.length - 1],
    input.activityPoints[0],
  );
  const endpointDirectionOk = directStart + directFinish <= reverseStart + reverseFinish;
  const directionOk = !directionRequired || (endpointDirectionOk && progress.forwardPercent >= 70);
  const distanceRatio = routeDistance ? activityDistance / routeDistance : 1;
  const shortcutSuspected = coverage < Math.min(autoCoverage, 92) || distanceRatio < 0.88 || progress.longestOffRouteKm >= Math.max(maxContinuousOffRouteKm, routeDistance * 0.04);

  const checkpointResults = input.checkpoints.map((checkpoint) => {
    const nearest = nearestDistanceM([checkpoint.latitude, checkpoint.longitude, null], activity);
    return { ...checkpoint, hit: nearest <= checkpoint.radius_m, nearest_distance_m: Math.round(nearest) };
  });
  const checkpointsHit = checkpointResults.filter((checkpoint) => checkpoint.hit).length;
  const checkpointRatio = checkpointResults.length ? checkpointsHit / checkpointResults.length : 1;

  let status: ValidationReport["status"] = "rejected";
  if (coverage >= autoCoverage && startOk && finishOk && directionOk && checkpointRatio >= autoCheckpointRatio && !shortcutSuspected && progress.offRoutePercent <= autoMaxOffRoute) {
    status = "validated";
  } else if (coverage >= reviewCoverage && startOk && finishOk && directionOk && checkpointRatio >= reviewCheckpointRatio && progress.offRoutePercent <= reviewMaxOffRoute) {
    status = "manual_review";
  }

  const notes: string[] = [];
  if (!startOk) notes.push(`Largada fora da tolerância (${Math.round(startDistance)} m).`);
  if (!finishOk) notes.push(`Chegada fora da tolerância (${Math.round(finishDistance)} m).`);
  if (!directionOk) notes.push("O sentido aparente da atividade está invertido.");
  if (coverage < autoCoverage) notes.push(`Cobertura abaixo do mínimo automático de ${autoCoverage}% (${coverage.toFixed(1)}%).`);
  if (progress.offRoutePercent > autoMaxOffRoute) notes.push(`${progress.offRoutePercent.toFixed(1)}% da atividade foi registrado fora da tolerância; o limite automático é ${autoMaxOffRoute}%.`);
  if (progress.longestOffRouteKm >= 1) notes.push(`Maior trecho contínuo fora da rota: ${progress.longestOffRouteKm.toFixed(2)} km.`);
  if (shortcutSuspected) notes.push("Possível corte de percurso ou trecho oficial não percorrido; requer conferência do mapa.");
  if (checkpointRatio < 0.95) notes.push(`${checkpointsHit} de ${checkpointResults.length} checkpoints confirmados.`);
  if (!notes.length) notes.push("Atividade compatível com a rota oficial dentro das tolerâncias configuradas.");

  return {
    status,
    coverage_percent: Number(coverage.toFixed(2)),
    matched_route_km: Number(coverageResult.matchedKm.toFixed(2)),
    route_distance_km: Number(routeDistance.toFixed(2)),
    activity_distance_km: Number(activityDistance.toFixed(2)),
    start_ok: startOk,
    finish_ok: finishOk,
    direction_ok: directionOk,
    forward_progress_percent: Number(progress.forwardPercent.toFixed(2)),
    off_route_percent: Number(progress.offRoutePercent.toFixed(2)),
    longest_off_route_km: Number(progress.longestOffRouteKm.toFixed(2)),
    max_deviation_m: Math.round(progress.maxDeviationM),
    shortcut_suspected: shortcutSuspected,
    checkpoints_hit: checkpointsHit,
    checkpoints_total: checkpointResults.length,
    checkpoint_results: checkpointResults,
    tolerance_m: toleranceM,
    notes,
  };
}
