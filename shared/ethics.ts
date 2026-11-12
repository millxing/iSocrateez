import type {
  AnswerRecord,
  Axis,
  ProfileTuple,
  Question,
  RankedProfile
} from "./contracts";
import { philosophyProfiles } from "./philosophyProfiles";
import { questionBank } from "./questionBank";

const AXES: Axis[] = [
  "outcomesPrinciples",
  "individualCollective",
  "reasonIntuition"
];

export const axisLabels: Record<Axis, { negLabel: string; posLabel: string; title: string }> = {
  outcomesPrinciples: {
    negLabel: "Outcomes",
    posLabel: "Principles",
    title: "Outcomes to Principles"
  },
  individualCollective: {
    negLabel: "Individual",
    posLabel: "Collective",
    title: "Individual to Collective"
  },
  reasonIntuition: {
    negLabel: "Reason",
    posLabel: "Intuition",
    title: "Reason to Intuition"
  }
};

export function randomizeQuestions(
  source: Question[] = questionBank,
  random = Math.random
): Question[] {
  const picks = AXES.flatMap((axis) => {
    const pool = source.filter((question) => question.axis === axis);
    const shuffled = shuffle(pool, random);
    return shuffled.slice(0, 3);
  });

  return shuffle(picks, random);
}

/** Fewer answers than this on an axis give too coarse a score to use. */
export const MIN_ANSWERS_PER_AXIS = 3;

/** Adds one unused question for each axis, so a calibration can be refined in rounds. */
export function extendQuestions(
  current: Question[],
  source: Question[] = questionBank,
  random = Math.random
): Question[] {
  const used = new Set(current.map((question) => question.id));
  const picks = AXES.flatMap((axis) => {
    const pool = source.filter((question) => question.axis === axis && !used.has(question.id));
    return shuffle(pool, random).slice(0, 1);
  });

  return [...current, ...shuffle(picks, random)];
}

/** True for a set of answers that can be scored: known, unique questions and enough for each axis. */
export function isValidAnswerSet(
  value: unknown,
  source: Question[] = questionBank
): value is AnswerRecord[] {
  if (!Array.isArray(value) || value.length > source.length) {
    return false;
  }

  const questionById = new Map(source.map((question) => [question.id, question]));
  const seen = new Set<string>();
  const counts: Record<Axis, number> = {
    outcomesPrinciples: 0,
    individualCollective: 0,
    reasonIntuition: 0
  };

  for (const answer of value as Partial<AnswerRecord>[]) {
    const question = typeof answer?.questionId === "string" ? questionById.get(answer.questionId) : undefined;
    if (!question || seen.has(question.id)) {
      return false;
    }
    if (!Number.isInteger(answer.value) || Math.abs(answer.value as number) > 2) {
      return false;
    }
    seen.add(question.id);
    counts[question.axis] += 1;
  }

  return AXES.every((axis) => counts[axis] >= MIN_ANSWERS_PER_AXIS);
}

export function isValidProfileTuple(value: unknown): value is ProfileTuple {
  if (!value || typeof value !== "object") {
    return false;
  }

  const tuple = value as Record<Axis, unknown>;
  return AXES.every((axis) => {
    const entry = tuple[axis];
    return typeof entry === "number" && Number.isFinite(entry) && entry >= -1 && entry <= 1;
  });
}

export function scoreProfile(
  answers: AnswerRecord[],
  source: Question[] = questionBank
): ProfileTuple {
  const questionById = new Map(source.map((question) => [question.id, question]));
  const totals: Record<Axis, number[]> = {
    outcomesPrinciples: [],
    individualCollective: [],
    reasonIntuition: []
  };

  answers.forEach((answer) => {
    const question = questionById.get(answer.questionId);
    if (!question) {
      return;
    }

    const orientedValue = answer.value * question.polarity;
    totals[question.axis].push(orientedValue);
  });

  return {
    outcomesPrinciples: normalizeAverage(totals.outcomesPrinciples),
    individualCollective: normalizeAverage(totals.individualCollective),
    reasonIntuition: normalizeAverage(totals.reasonIntuition)
  };
}

function normalizeAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Number((average / 2).toFixed(3));
}

export function rankPhilosophies(profile: ProfileTuple): RankedProfile[] {
  return philosophyProfiles
    .flatMap((philosophy) => (philosophy.coordinates ? [{ philosophy, coordinates: philosophy.coordinates }] : []))
    .map(({ philosophy, coordinates }) => {
      const distance = euclideanDistance(profile, coordinates);

      return {
        ...philosophy,
        distance: Number(distance.toFixed(3)),
        whyItFits: buildWhyItFits(profile, coordinates)
      };
    })
    .sort((left, right) => left.distance - right.distance);
}

export function formatTuple(profile: ProfileTuple): string {
  return `(${profile.outcomesPrinciples.toFixed(2)}, ${profile.individualCollective.toFixed(2)}, ${profile.reasonIntuition.toFixed(2)})`;
}

export function describeAxisPosition(axis: Axis, value: number): string {
  const { negLabel, posLabel } = axisLabels[axis];

  if (value <= -0.55) {
    return `Strongly toward ${negLabel.toLowerCase()}`;
  }

  if (value <= -0.2) {
    return `Moderately toward ${negLabel.toLowerCase()}`;
  }

  if (value >= 0.55) {
    return `Strongly toward ${posLabel.toLowerCase()}`;
  }

  if (value >= 0.2) {
    return `Moderately toward ${posLabel.toLowerCase()}`;
  }

  return `Balanced between ${negLabel.toLowerCase()} and ${posLabel.toLowerCase()}`;
}

function euclideanDistance(left: ProfileTuple, right: ProfileTuple): number {
  return Math.sqrt(
    Math.pow(left.outcomesPrinciples - right.outcomesPrinciples, 2) +
      Math.pow(left.individualCollective - right.individualCollective, 2) +
      Math.pow(left.reasonIntuition - right.reasonIntuition, 2)
  );
}

function buildWhyItFits(user: ProfileTuple, profile: ProfileTuple): string {
  const comparisons = AXES.map((axis) => {
    const delta = Math.abs(user[axis] - profile[axis]);
    const label = axisLabels[axis].title;

    if (delta < 0.2) {
      return `${label}: closely aligned`;
    }

    if (delta < 0.45) {
      return `${label}: reasonably close`;
    }

    return `${label}: partial overlap`;
  });

  return comparisons.join(" • ");
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
