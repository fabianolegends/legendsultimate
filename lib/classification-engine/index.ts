export const BASE_STAGE_POINTS = [100, 85, 72, 61, 52, 44, 37, 31, 26, 22] as const;

export type StageClassificationInput = {
  id: string;
  athlete_id: string;
  registration_id?: string | null;
  full_name: string;
  category: string;
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
  overall_position: number;
  total_points: number;
  stages_completed: number;
  eligible_for_title: boolean;
  wins: number;
  second_places: number;
  third_places: number;
  stage_results: OverallStageResult[];
};

function isClassifiable(status: string) {
  return status === "provisional" || status === "official";
}

export function classifyStage(
  candidates: StageClassificationInput[],
  weight: number,
  timeLimitS?: number | null,
): StageClassificationResult[] {
  const initial = candidates.map((candidate) => ({
    ...candidate,
    status: timeLimitS && candidate.final_time_s > timeLimitS && isClassifiable(candidate.status) ? "dnf" : candidate.status,
    position: null as number | null,
    base_points: 0,
    weighted_points: 0,
  }));

  const byCategory = new Map<string, typeof initial>();
  for (const candidate of initial) {
    const current = byCategory.get(candidate.category) ?? [];
    current.push(candidate);
    byCategory.set(candidate.category, current);
  }

  for (const categoryResults of byCategory.values()) {
    const ranked = categoryResults
      .filter((candidate) => isClassifiable(candidate.status))
      .sort((left, right) => left.final_time_s - right.final_time_s || left.full_name.localeCompare(right.full_name, "pt-BR"));
    ranked.forEach((candidate, index) => {
      candidate.position = index + 1;
      candidate.base_points = BASE_STAGE_POINTS[index] ?? 0;
      candidate.weighted_points = Math.max(0, Math.round(candidate.base_points * weight) - Math.max(0, Number(candidate.points_penalty ?? 0)));
    });
  }

  return initial.sort((left, right) => left.category.localeCompare(right.category, "pt-BR")
    || (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER)
    || left.full_name.localeCompare(right.full_name, "pt-BR"));
}

export function buildOverallClassification(
  results: OverallStageResult[],
  totalStages: number,
): OverallClassificationResult[] {
  const athletes = new Map<string, OverallClassificationResult>();
  for (const result of results.filter((item) => isClassifiable(item.status))) {
    const identity = result.registration_id || result.athlete_id;
    const current = athletes.get(identity) ?? {
      athlete_id: result.athlete_id,
      registration_id: result.registration_id,
      full_name: result.full_name,
      bib_number: result.bib_number,
      category: result.category,
      overall_position: 0,
      total_points: 0,
      stages_completed: 0,
      eligible_for_title: false,
      wins: 0,
      second_places: 0,
      third_places: 0,
      stage_results: [],
    };
    current.stage_results.push(result);
    current.total_points += Number(result.weighted_points ?? 0);
    if (result.position === 1) current.wins += 1;
    if (result.position === 2) current.second_places += 1;
    if (result.position === 3) current.third_places += 1;
    athletes.set(identity, current);
  }

  for (const athlete of athletes.values()) {
    athlete.stage_results.sort((left, right) => left.stage_number - right.stage_number);
    athlete.stages_completed = new Set(athlete.stage_results.map((result) => result.stage_id)).size;
    athlete.eligible_for_title = totalStages > 0 && athlete.stages_completed === totalStages;
  }

  const byCategory = new Map<string, OverallClassificationResult[]>();
  for (const athlete of athletes.values()) {
    const current = byCategory.get(athlete.category) ?? [];
    current.push(athlete);
    byCategory.set(athlete.category, current);
  }

  const final: OverallClassificationResult[] = [];
  for (const categoryResults of byCategory.values()) {
    categoryResults.sort((left, right) => {
      if (left.eligible_for_title !== right.eligible_for_title) return left.eligible_for_title ? -1 : 1;
      if (right.total_points !== left.total_points) return right.total_points - left.total_points;
      const leftStage4 = left.stage_results.find((result) => result.stage_number === 4);
      const rightStage4 = right.stage_results.find((result) => result.stage_number === 4);
      const leftStage4Position = leftStage4?.position ?? Number.MAX_SAFE_INTEGER;
      const rightStage4Position = rightStage4?.position ?? Number.MAX_SAFE_INTEGER;
      if (leftStage4Position !== rightStage4Position) return leftStage4Position - rightStage4Position;
      if (right.wins !== left.wins) return right.wins - left.wins;
      if (right.second_places !== left.second_places) return right.second_places - left.second_places;
      if (right.third_places !== left.third_places) return right.third_places - left.third_places;
      const leftStage4Time = leftStage4?.final_time_s ?? Number.MAX_SAFE_INTEGER;
      const rightStage4Time = rightStage4?.final_time_s ?? Number.MAX_SAFE_INTEGER;
      return leftStage4Time - rightStage4Time || left.full_name.localeCompare(right.full_name, "pt-BR");
    });
    categoryResults.forEach((athlete, index) => { athlete.overall_position = index + 1; });
    final.push(...categoryResults);
  }
  return final.sort((left, right) => left.category.localeCompare(right.category, "pt-BR") || left.overall_position - right.overall_position);
}
