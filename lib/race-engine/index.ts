export type GeoPoint = [number, number, number | null];

export type CheckpointInput = {
  id?: string;
  sequence: number;
  label: string;
  latitude: number;
  longitude: number;
  radius_m: number;
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

function samplePoints(points: GeoPoint[], maxPoints = 900) {
  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => points[Math.round(index * step)]);
}

export function validateActivity(input: {
  officialPoints: GeoPoint[];
  activityPoints: GeoPoint[];
  checkpoints: CheckpointInput[];
  toleranceM?: number;
}): ValidationReport {
  const toleranceM = input.toleranceM ?? 120;
  const official = samplePoints(input.officialPoints);
  const activity = samplePoints(input.activityPoints, 1400);

  const matched = official.filter((point) => nearestDistanceM(point, activity) <= toleranceM).length;
  const coverage = official.length ? (matched / official.length) * 100 : 0;
  const routeDistance = polylineDistanceKm(input.officialPoints);
  const activityDistance = polylineDistanceKm(input.activityPoints);

  const startDistance = nearestDistanceM(input.officialPoints[0], activity);
  const finishDistance = nearestDistanceM(input.officialPoints[input.officialPoints.length - 1], activity);
  const startOk = startDistance <= Math.max(toleranceM, 180);
  const finishOk = finishDistance <= Math.max(toleranceM, 180);

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
  const directionOk = directStart + directFinish <= reverseStart + reverseFinish;

  const checkpointResults = input.checkpoints.map((checkpoint) => {
    const nearest = nearestDistanceM([checkpoint.latitude, checkpoint.longitude, null], activity);
    return { ...checkpoint, hit: nearest <= checkpoint.radius_m, nearest_distance_m: Math.round(nearest) };
  });
  const checkpointsHit = checkpointResults.filter((checkpoint) => checkpoint.hit).length;
  const checkpointRatio = checkpointResults.length ? checkpointsHit / checkpointResults.length : 1;

  let status: ValidationReport["status"] = "rejected";
  if (coverage >= 95 && startOk && finishOk && directionOk && checkpointRatio >= 0.95) {
    status = "validated";
  } else if (coverage >= 80 && startOk && finishOk && checkpointRatio >= 0.8) {
    status = "manual_review";
  }

  const notes: string[] = [];
  if (!startOk) notes.push(`Largada fora da tolerância (${Math.round(startDistance)} m).`);
  if (!finishOk) notes.push(`Chegada fora da tolerância (${Math.round(finishDistance)} m).`);
  if (!directionOk) notes.push("O sentido aparente da atividade está invertido.");
  if (coverage < 95) notes.push(`Cobertura abaixo de 95% (${coverage.toFixed(1)}%).`);
  if (checkpointRatio < 0.95) notes.push(`${checkpointsHit} de ${checkpointResults.length} checkpoints confirmados.`);
  if (!notes.length) notes.push("Atividade compatível com a rota oficial dentro das tolerâncias configuradas.");

  return {
    status,
    coverage_percent: Number(coverage.toFixed(2)),
    matched_route_km: Number(((coverage / 100) * routeDistance).toFixed(2)),
    route_distance_km: Number(routeDistance.toFixed(2)),
    activity_distance_km: Number(activityDistance.toFixed(2)),
    start_ok: startOk,
    finish_ok: finishOk,
    direction_ok: directionOk,
    checkpoints_hit: checkpointsHit,
    checkpoints_total: checkpointResults.length,
    checkpoint_results: checkpointResults,
    tolerance_m: toleranceM,
    notes,
  };
}
