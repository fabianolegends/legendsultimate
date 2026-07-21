import { distanceKm, type GeoPoint } from "@/lib/race-engine";

export type TimingCheckpoint = {
  id: string;
  sequence: number;
  label: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  checkpoint_kind?: "start" | "control" | "finish" | string;
};

export type TimedSegment = {
  id: string;
  name: string;
  segment_type: "climb" | "sprint" | "custom" | string;
  start_checkpoint_id: string;
  finish_checkpoint_id: string;
};

export type PassageDetection = {
  checkpoint_id: string;
  sequence: number;
  label: string;
  checkpoint_kind: string;
  passed: boolean;
  point_index: number | null;
  elapsed_s: number | null;
  activity_distance_m: number | null;
  nearest_distance_m: number;
  passed_at: string | null;
};

export type SegmentDetection = {
  segment_id: string;
  name: string;
  segment_type: string;
  completed: boolean;
  start_checkpoint_id: string;
  finish_checkpoint_id: string;
  start_elapsed_s: number | null;
  finish_elapsed_s: number | null;
  elapsed_s: number | null;
  start_passed_at: string | null;
  finish_passed_at: string | null;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function pointDistanceM(point: GeoPoint, checkpoint: TimingCheckpoint) {
  return distanceKm(point, [checkpoint.latitude, checkpoint.longitude, null]) * 1000;
}

function interpolateCrossing(input: {
  previousDistanceM: number;
  currentDistanceM: number;
  radiusM: number;
  previousElapsedS: number;
  currentElapsedS: number;
  previousActivityDistanceM: number;
  currentActivityDistanceM: number;
}) {
  const denominator = input.previousDistanceM - input.currentDistanceM;
  const ratio = Math.abs(denominator) < 0.001
    ? 1
    : clamp((input.previousDistanceM - input.radiusM) / denominator, 0, 1);
  return {
    elapsedS: input.previousElapsedS + (input.currentElapsedS - input.previousElapsedS) * ratio,
    activityDistanceM: input.previousActivityDistanceM + (input.currentActivityDistanceM - input.previousActivityDistanceM) * ratio,
  };
}

export function detectCheckpointPassages(input: {
  activityPoints: GeoPoint[];
  elapsedSeconds: number[];
  activityDistanceMeters: number[];
  startedAt: string;
  checkpoints: TimingCheckpoint[];
}): PassageDetection[] {
  const checkpoints = [...input.checkpoints].sort((a, b) => a.sequence - b.sequence);
  const activityPoints = input.activityPoints;
  const startedAtMs = new Date(input.startedAt).getTime();
  let searchStartIndex = 0;

  return checkpoints.map((checkpoint) => {
    let firstInsideIndex = -1;
    let nearestIndex = -1;
    let nearestDistanceM = Number.POSITIVE_INFINITY;
    let outsideAfterEntry = 0;

    for (let index = searchStartIndex; index < activityPoints.length; index += 1) {
      const distanceM = pointDistanceM(activityPoints[index], checkpoint);
      if (distanceM < nearestDistanceM) {
        nearestDistanceM = distanceM;
        nearestIndex = index;
      }

      if (distanceM <= checkpoint.radius_m) {
        if (firstInsideIndex < 0) firstInsideIndex = index;
        outsideAfterEntry = 0;
      } else if (firstInsideIndex >= 0) {
        outsideAfterEntry += 1;
        if (outsideAfterEntry >= 4) break;
      }
    }

    if (firstInsideIndex < 0) {
      return {
        checkpoint_id: checkpoint.id,
        sequence: checkpoint.sequence,
        label: checkpoint.label,
        checkpoint_kind: checkpoint.checkpoint_kind ?? "control",
        passed: false,
        point_index: null,
        elapsed_s: null,
        activity_distance_m: null,
        nearest_distance_m: Number.isFinite(nearestDistanceM) ? Number(nearestDistanceM.toFixed(1)) : 0,
        passed_at: null,
      };
    }

    const currentIndex = firstInsideIndex;
    const previousIndex = Math.max(searchStartIndex, currentIndex - 1);
    const currentDistanceToCheckpointM = pointDistanceM(activityPoints[currentIndex], checkpoint);
    const previousDistanceToCheckpointM = pointDistanceM(activityPoints[previousIndex], checkpoint);
    const previousElapsedS = Number(input.elapsedSeconds[previousIndex] ?? previousIndex);
    const currentElapsedS = Number(input.elapsedSeconds[currentIndex] ?? currentIndex);
    const previousActivityDistanceM = Number(input.activityDistanceMeters[previousIndex] ?? 0);
    const currentActivityDistanceM = Number(input.activityDistanceMeters[currentIndex] ?? previousActivityDistanceM);
    const crossing = previousIndex === currentIndex
      ? { elapsedS: currentElapsedS, activityDistanceM: currentActivityDistanceM }
      : interpolateCrossing({
          previousDistanceM: previousDistanceToCheckpointM,
          currentDistanceM: currentDistanceToCheckpointM,
          radiusM: checkpoint.radius_m,
          previousElapsedS,
          currentElapsedS,
          previousActivityDistanceM,
          currentActivityDistanceM,
        });

    searchStartIndex = Math.min(activityPoints.length - 1, Math.max(currentIndex, nearestIndex));
    const passedAt = Number.isFinite(startedAtMs)
      ? new Date(startedAtMs + crossing.elapsedS * 1000).toISOString()
      : null;

    return {
      checkpoint_id: checkpoint.id,
      sequence: checkpoint.sequence,
      label: checkpoint.label,
      checkpoint_kind: checkpoint.checkpoint_kind ?? "control",
      passed: true,
      point_index: currentIndex,
      elapsed_s: Number(crossing.elapsedS.toFixed(3)),
      activity_distance_m: Number(crossing.activityDistanceM.toFixed(3)),
      nearest_distance_m: Number(Math.min(nearestDistanceM, currentDistanceToCheckpointM).toFixed(1)),
      passed_at: passedAt,
    };
  });
}

export function calculateSegmentResults(
  segments: TimedSegment[],
  passages: PassageDetection[],
): SegmentDetection[] {
  const passageMap = new Map(passages.map((passage) => [passage.checkpoint_id, passage]));
  return segments.map((segment) => {
    const start = passageMap.get(segment.start_checkpoint_id);
    const finish = passageMap.get(segment.finish_checkpoint_id);
    const completed = Boolean(
      start?.passed &&
      finish?.passed &&
      start.elapsed_s !== null &&
      finish.elapsed_s !== null &&
      finish.elapsed_s > start.elapsed_s,
    );
    return {
      segment_id: segment.id,
      name: segment.name,
      segment_type: segment.segment_type,
      completed,
      start_checkpoint_id: segment.start_checkpoint_id,
      finish_checkpoint_id: segment.finish_checkpoint_id,
      start_elapsed_s: start?.elapsed_s ?? null,
      finish_elapsed_s: finish?.elapsed_s ?? null,
      elapsed_s: completed ? Number(((finish?.elapsed_s ?? 0) - (start?.elapsed_s ?? 0)).toFixed(3)) : null,
      start_passed_at: start?.passed_at ?? null,
      finish_passed_at: finish?.passed_at ?? null,
    };
  });
}

export function buildFallbackDistanceStream(points: GeoPoint[]) {
  const distances: number[] = [0];
  for (let index = 1; index < points.length; index += 1) {
    distances.push(distances[index - 1] + distanceKm(points[index - 1], points[index]) * 1000);
  }
  return distances;
}
