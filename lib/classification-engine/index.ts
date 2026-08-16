export const PROPORTIONAL_POINTS_BASE = 100;
export const POINTS_PRECISION = 2;

export type StageClassificationInput = {
  id: string;
  athlete_id: string;
  registration_id?: string | null;
  full_name: string;
  category: string;
  journey_format?: "ultimate" | "short" | string;
  final_time_s: number;
  points_penalty?: number;
  status: "provisional" | "review" | "official" | "disqualified" | "dnf" | string;
};

export type StageClassificationResult = StageClassificationInput & {
  position: number | null;
  base_points: number;
  weighted_points: number;
};

export type OverallStageResult = {
  athlete_id: string;
  registration_id?: string | null;
  full_name: string;
  bib_number?: string | null;
  category: string;
  journey_format?: "ultimate" | "short" | string;
  stage_id: string;
  stage_number: number;
  position: number | null;
  final_time_s: number;
  weighted_points: number;
  status: string;
};

export type OverallClassificationResult = {
  athlete_id: string;
  registration_id?: string | null;
  full_name: string;
  bib_number?: string | null;
  category: string;
  journey_format: string;
  overall_position: number;
  total_points: number;
  stages_completed: number;
  eligible_for_title: boolean;
  wins: number;
  second_places: number;
  third_places: number;
  stage3_points: number;
  total_valid_time_s: number;
  stage4_position: number | null;
  shared_position: boolean;
  stage_results: OverallStageResult[];
};

function isClassifiable(status: string) {
  return status === "provisional" || status === "official";
}

function hasValidTime(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function roundPoints(value: number) {
  const factor = 10 ** POINTS_PRECISION;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function classifyStage(
  candidates: StageClassificationInput[],
  weight: number,
  timeLimitS?: number | null,
): StageClassificationResult[] {
  if (!Number.isFinite(weight) || weight <= 0) {
    throw new RangeError("O coeficiente da etapa deve ser um número maior que zero.");
  }

  const initial = candidates.map((candidate) => ({
    ...candidate,
    status: isClassifiable(candidate.status) && !hasValidTime(candidate.final_time_s)
      ? "review"
      : timeLimitS && candidate.final_time_s > timeLimitS && isClassifiable(candidate.status)
        ? "dnf"
        : candidate.status,
    position: null as number | null,
    base_points: 0,
    weighted_points: 0,
  }));

  const byCategory = new Map<string, typeof initial>();
  for (const candidate of initial) {
    const groupKey = `${candidate.journey_format ?? "ultimate"}:${candidate.category}`;
    const current = byCategory.get(groupKey) ?? [];
    current.push(candidate);
    byCategory.set(groupKey, current);
  }

  for (const categoryResults of byCategory.values()) {
    const ranked = categoryResults
      .filter((candidate) => isClassifiable(candidate.status) && hasValidTime(candidate.final_time_s))
      .sort((left, right) => left.final_time_s - right.final_time_s || left.full_name.localeCompare(right.full_name, "pt-BR"));
    const bestValidTimeS = ranked[0]?.final_time_s;
    if (!bestValidTimeS) continue;
    let previousTimeS: number | null = null;
    let previousPosition = 0;

    ranked.forEach((candidate, index) => {
      const position = previousTimeS === candidate.final_time_s ? previousPosition : index + 1;
      const proportionalPoints = PROPORTIONAL_POINTS_BASE * (bestValidTimeS / candidate.final_time_s);
      const pointsPenalty = Math.max(0, Number(candidate.points_penalty ?? 0));

      candidate.position = position;
      candidate.base_points = roundPoints(proportionalPoints);
      candidate.weighted_points = roundPoints(Math.max(0, proportionalPoints * weight - pointsPenalty));
      previousTimeS = candidate.final_time_s;
      previousPosition = position;
    });
  }

  return initial.sort((left, right) => (left.journey_format ?? "ultimate").localeCompare(right.journey_format ?? "ultimate", "pt-BR")
    || left.category.localeCompare(right.category, "pt-BR")
    || (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER)
    || left.full_name.localeCompare(right.full_name, "pt-BR"));
}

function compareOverallSportingCriteria(left: OverallClassificationResult, right: OverallClassificationResult) {
  if (left.eligible_for_title !== right.eligible_for_title) return left.eligible_for_title ? -1 : 1;
  if (right.total_points !== left.total_points) return right.total_points - left.total_points;
  if (right.wins !== left.wins) return right.wins - left.wins;
  if (right.stage3_points !== left.stage3_points) return right.stage3_points - left.stage3_points;
  if (left.total_valid_time_s !== right.total_valid_time_s) return left.total_valid_time_s - right.total_valid_time_s;
  const leftStage4Position = left.stage4_position ?? Number.MAX_SAFE_INTEGER;
  const rightStage4Position = right.stage4_position ?? Number.MAX_SAFE_INTEGER;
  return leftStage4Position - rightStage4Position;
}

export function buildOverallClassification(
  results: OverallStageResult[],
  totalStages: number,
  expectedStagesByFormat: Record<string, number[]> = {},
): OverallClassificationResult[] {
  const athletes = new Map<string, OverallClassificationResult>();
  for (const result of results.filter((item) => isClassifiable(item.status))) {
    const identity = `${result.journey_format ?? "ultimate"}:${result.registration_id || result.athlete_id}`;
    const current = athletes.get(identity) ?? {
      athlete_id: result.athlete_id,
      registration_id: result.registration_id,
      full_name: result.full_name,
      bib_number: result.bib_number,
      category: result.category,
      journey_format: result.journey_format ?? "ultimate",
      overall_position: 0,
      total_points: 0,
      stages_completed: 0,
      eligible_for_title: false,
      wins: 0,
      second_places: 0,
      third_places: 0,
      stage3_points: 0,
      total_valid_time_s: 0,
      stage4_position: null,
      shared_position: false,
      stage_results: [],
    };
    current.stage_results.push(result);
    current.total_points = roundPoints(current.total_points + Number(result.weighted_points ?? 0));
    current.total_valid_time_s += Number(result.final_time_s ?? 0);
    if (result.position === 1) current.wins += 1;
    if (result.position === 2) current.second_places += 1;
    if (result.position === 3) current.third_places += 1;
    athletes.set(identity, current);
  }

  for (const athlete of athletes.values()) {
    athlete.stage_results.sort((left, right) => left.stage_number - right.stage_number);
    athlete.stages_completed = new Set(athlete.stage_results.map((result) => result.stage_id)).size;
    const expectedStages = expectedStagesByFormat[athlete.journey_format];
    athlete.eligible_for_title = expectedStages?.length
      ? expectedStages.every((stageNumber) => athlete.stage_results.some((result) => result.stage_number === stageNumber))
      : totalStages > 0 && athlete.stages_completed === totalStages;
    athlete.stage3_points = Number(athlete.stage_results.find((result) => result.stage_number === 3)?.weighted_points ?? 0);
    athlete.stage4_position = athlete.stage_results.find((result) => result.stage_number === 4)?.position ?? null;
  }

  const byCategory = new Map<string, OverallClassificationResult[]>();
  for (const athlete of athletes.values()) {
    const groupKey = `${athlete.journey_format}:${athlete.category}`;
    const current = byCategory.get(groupKey) ?? [];
    current.push(athlete);
    byCategory.set(groupKey, current);
  }

  const final: OverallClassificationResult[] = [];
  for (const categoryResults of byCategory.values()) {
    categoryResults.sort((left, right) => compareOverallSportingCriteria(left, right)
      || left.full_name.localeCompare(right.full_name, "pt-BR"));
    categoryResults.forEach((athlete, index) => {
      const previous = categoryResults[index - 1];
      athlete.overall_position = previous && compareOverallSportingCriteria(previous, athlete) === 0
        ? previous.overall_position
        : index + 1;
    });
    const positionFrequency = new Map<number, number>();
    for (const athlete of categoryResults) {
      positionFrequency.set(athlete.overall_position, (positionFrequency.get(athlete.overall_position) ?? 0) + 1);
    }
    for (const athlete of categoryResults) athlete.shared_position = (positionFrequency.get(athlete.overall_position) ?? 0) > 1;
    final.push(...categoryResults);
  }
  return final.sort((left, right) => left.journey_format.localeCompare(right.journey_format, "pt-BR") || left.category.localeCompare(right.category, "pt-BR") || left.overall_position - right.overall_position);
}
