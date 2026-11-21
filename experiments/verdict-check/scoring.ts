/** Pure functions: task list and scoring. No file or process access. */
import type { Axis, ProfileTuple } from "../../shared/contracts";
import { TEST_PHILOSOPHERS, type ExpectedVerdict, type KeyAxis, type TestPhilosopherId, type VerdictDilemma } from "./answerKey";
import type { CasePair, PairExpectation } from "./pairs";

/** An option id, or "none": the advice commits to no listed option. */
export type Verdict = string;
/** Verdicts by task id. A task that has not run (or has no valid verdict) is absent. */
export type VerdictMap = Record<string, Verdict | undefined>;

export const PRODUCTION_AXES: Axis[] = ["outcomesPrinciples", "individualCollective", "reasonIntuition"];
export const POLE_VALUE = 0.85;

export type Task =
  | { id: string; route: "voice"; dilemmaId: string; philosopherId: TestPhilosopherId }
  | { id: string; route: "profile"; dilemmaId: string; axis: Axis; pole: "neg" | "pos"; profile: ProfileTuple }
  | { id: string; route: "pair"; pairId: string; arm: Arm; side: "base" | "variant"; text: string };

/** A pair is run for each test philosopher (core and transfer) and for a baseline with no philosopher. */
export type Arm = "baseline" | TestPhilosopherId;
export const ARMS: Arm[] = ["baseline", ...TEST_PHILOSOPHERS];

export const voiceTaskId = (dilemmaId: string, philosopherId: string) => `voice__${dilemmaId}__${philosopherId}`;
export const profileTaskId = (dilemmaId: string, axis: string, pole: "neg" | "pos") => `profile__${dilemmaId}__${axis}__${pole}`;

export const pairTaskId = (pairId: string, arm: Arm, side: "base" | "variant") => `pair__${pairId}__${arm}__${side}`;

export function buildTasks(dilemmas: VerdictDilemma[], pairs: CasePair[]): Task[] {
  const tasks: Task[] = [];
  for (const dilemma of dilemmas) {
    for (const philosopherId of TEST_PHILOSOPHERS) {
      if (!dilemma.philosophers[philosopherId]) continue;
      tasks.push({ id: voiceTaskId(dilemma.id, philosopherId), route: "voice", dilemmaId: dilemma.id, philosopherId });
    }
    for (const { axis } of dilemma.axes) {
      if (!PRODUCTION_AXES.includes(axis as Axis)) continue; // the app has no input for this axis
      for (const pole of ["neg", "pos"] as const) {
        const profile: ProfileTuple = { outcomesPrinciples: 0, individualCollective: 0, reasonIntuition: 0 };
        profile[axis as Axis] = pole === "neg" ? -POLE_VALUE : POLE_VALUE;
        tasks.push({ id: profileTaskId(dilemma.id, axis, pole), route: "profile", dilemmaId: dilemma.id, axis: axis as Axis, pole, profile });
      }
    }
  }
  for (const pair of pairs) {
    for (const arm of ARMS) {
      for (const side of ["base", "variant"] as const) {
        tasks.push({ id: pairTaskId(pair.id, arm, side), route: "pair", pairId: pair.id, arm, side, text: pair[side] });
      }
    }
  }
  return tasks;
}

export function isMatch(expected: ExpectedVerdict, verdict: Verdict): boolean {
  return verdict === expected.option || (expected.alsoAccept ?? []).includes(verdict);
}

export interface Rate {
  hit: number;
  total: number;
}

// ---------- voice ----------

export interface VoiceRow {
  dilemmaId: string;
  kind: VerdictDilemma["kind"];
  philosopherId: TestPhilosopherId;
  verdict?: Verdict;
  expected?: ExpectedVerdict;
  /** Undefined when there is no key entry or no verdict. */
  match?: boolean;
}

export interface VoiceScore {
  rows: VoiceRow[];
  tasks: number;
  missing: number;
  matchOverall: Rate;
  matchClear: Rate;
  matchByPhilosopher: Record<TestPhilosopherId, Rate>;
  noneVerdicts: Rate;
  split: {
    dilemmas: number;
    /** Open entries in the split dilemmas, counted from the key. They are not scored. */
    openEntries: number;
  };
  /** Agreement dilemmas where every keyed philosopher got the expected option. */
  agreement: { dilemmas: number; complete: number; allExpected: number };
}

const rate = (hit: number, total: number): Rate => ({ hit, total });

export function scoreVoice(dilemmas: VerdictDilemma[], verdicts: VerdictMap): VoiceScore {
  const rows: VoiceRow[] = [];
  for (const dilemma of dilemmas) {
    for (const philosopherId of TEST_PHILOSOPHERS) {
      if (!dilemma.philosophers[philosopherId]) continue;
      const verdict = verdicts[voiceTaskId(dilemma.id, philosopherId)];
      const expected = dilemma.philosophers[philosopherId];
      rows.push({
        dilemmaId: dilemma.id,
        kind: dilemma.kind,
        philosopherId,
        verdict,
        expected,
        match: verdict !== undefined && expected ? isMatch(expected, verdict) : undefined
      });
    }
  }

  const scored = rows.filter((row) => row.match !== undefined);
  const clear = scored.filter((row) => row.expected?.confidence === "clear");
  const given = rows.filter((row) => row.verdict !== undefined);
  const matchByPhilosopher = Object.fromEntries(
    TEST_PHILOSOPHERS.map((id) => {
      const own = scored.filter((row) => row.philosopherId === id);
      return [id, rate(own.filter((row) => row.match).length, own.length)];
    })
  ) as Record<TestPhilosopherId, Rate>;

  const splitDilemmas = dilemmas.filter((dilemma) => dilemma.kind === "split");
  const agreementDilemmas = dilemmas.filter((dilemma) => dilemma.kind === "agreement");
  const agreementRows = (dilemma: VerdictDilemma) => rows.filter((row) => row.dilemmaId === dilemma.id);
  const agreementComplete = agreementDilemmas.filter((dilemma) => agreementRows(dilemma).every((row) => row.verdict !== undefined));

  return {
    rows,
    tasks: rows.length,
    missing: rows.length - given.length,
    matchOverall: rate(scored.filter((row) => row.match).length, scored.length),
    matchClear: rate(clear.filter((row) => row.match).length, clear.length),
    matchByPhilosopher,
    noneVerdicts: rate(given.filter((row) => row.verdict === "none").length, given.length),
    split: {
      dilemmas: splitDilemmas.length,
      openEntries: splitDilemmas.reduce((sum, dilemma) => sum + Object.keys(dilemma.open ?? {}).length, 0)
    },
    agreement: {
      dilemmas: agreementDilemmas.length,
      complete: agreementComplete.length,
      allExpected: agreementComplete.filter((dilemma) => agreementRows(dilemma).every((row) => row.match === true)).length
    }
  };
}

// ---------- profile ----------

export interface ProfileRow {
  dilemmaId: string;
  axis: Axis;
  expectedNeg: Verdict;
  expectedPos: Verdict;
  verdictNeg?: Verdict;
  verdictPos?: Verdict;
  /** Undefined when a verdict is missing. */
  bothMatch?: boolean;
  differs?: boolean;
}

export interface ProfileAggregate {
  pairs: number;
  complete: number;
  bothMatch: number;
  /** The two poles got different verdicts, neither "none". */
  differs: number;
}

export interface ProfileScore {
  rows: ProfileRow[];
  tasks: number;
  missing: number;
  overall: ProfileAggregate;
  byAxis: Record<Axis, ProfileAggregate>;
}

export function scoreProfile(dilemmas: VerdictDilemma[], verdicts: VerdictMap): ProfileScore {
  const rows: ProfileRow[] = [];
  for (const dilemma of dilemmas) {
    for (const entry of dilemma.axes) {
      if (!PRODUCTION_AXES.includes(entry.axis as Axis)) continue;
      const axis = entry.axis as Axis;
      const verdictNeg = verdicts[profileTaskId(dilemma.id, axis, "neg")];
      const verdictPos = verdicts[profileTaskId(dilemma.id, axis, "pos")];
      const complete = verdictNeg !== undefined && verdictPos !== undefined;
      rows.push({
        dilemmaId: dilemma.id,
        axis,
        expectedNeg: entry.negative,
        expectedPos: entry.positive,
        verdictNeg,
        verdictPos,
        bothMatch: complete ? verdictNeg === entry.negative && verdictPos === entry.positive : undefined,
        differs: complete ? verdictNeg !== verdictPos && verdictNeg !== "none" && verdictPos !== "none" : undefined
      });
    }
  }
  const aggregate = (list: ProfileRow[]): ProfileAggregate => ({
    pairs: list.length,
    complete: list.filter((row) => row.bothMatch !== undefined).length,
    bothMatch: list.filter((row) => row.bothMatch).length,
    differs: list.filter((row) => row.differs).length
  });
  const missingVerdicts = rows.reduce((sum, row) => sum + (row.verdictNeg === undefined ? 1 : 0) + (row.verdictPos === undefined ? 1 : 0), 0);
  return {
    rows,
    tasks: rows.length * 2,
    missing: missingVerdicts,
    overall: aggregate(rows),
    byAxis: Object.fromEntries(PRODUCTION_AXES.map((axis) => [axis, aggregate(rows.filter((row) => row.axis === axis))])) as Record<Axis, ProfileAggregate>
  };
}

// ---------- pairs ----------

export type PairResult = "correct" | "wrong direction" | "no flip" | "held other answer" | "changed" | "no choice" | "missing";

export interface PairRow {
  pairId: string;
  philosopherId: TestPhilosopherId;
  expect: PairExpectation["expect"];
  basis: PairExpectation["basis"];
  expectedBase: string;
  expectedVariant: string;
  verdictBase?: Verdict;
  verdictVariant?: Verdict;
  /** Flip: both verdicts are options and they differ. Same: both are options and equal. Undefined when a verdict is missing. */
  responded?: boolean;
  /** Both verdicts equal the expected options. Undefined when a verdict is missing. */
  correct?: boolean;
  /** "<base>→<variant>"; a missing verdict shows as "missing". */
  pattern: string;
  baselinePattern: string;
  /** Both patterns complete and not equal. Undefined if either is incomplete. */
  differsFromBaseline?: boolean;
  /** The judge said the advice rests on the pivot fact, on both sides. */
  usesPivotBoth: boolean;
}

export interface PairAggregate {
  total: number;
  complete: number;
  correct: number;
}
export interface FlipAggregate extends PairAggregate {
  /** Responded, but not as expected. */
  wrongDirection: number;
  /** Did not respond: the verdict stayed. */
  noFlip: number;
}
export interface SameAggregate extends PairAggregate {
  /** Responded (stayed the same), but on another option than expected. */
  heldOtherAnswer: number;
  /** Did not respond: the verdict changed. */
  changed: number;
}

export interface MatrixRow {
  pairId: string;
  /** One pattern for each arm; "incomplete" if a verdict is missing. */
  patterns: Record<Arm, string>;
  /** Distinct complete patterns among the test philosophers. */
  distinct: number;
  /** All test philosophers and the baseline have the same complete pattern. */
  allSame: boolean;
}

export interface PairScore {
  rows: PairRow[];
  /** Tasks for the keyed thinkers only. */
  tasks: number;
  missing: number;
  flip: FlipAggregate;
  same: SameAggregate;
  /** Keyed rows where either verdict is "none". */
  noChoice: number;
  /** Correct rows that differ from the baseline. */
  correctAndDifferent: number;
  /** Correct rows where the judge said both sides use the pivot. */
  correctAndUsesPivot: number;
  byPhilosopher: Record<TestPhilosopherId, PairAggregate>;
  byExpect: Record<PairExpectation["expect"], PairAggregate>;
  /** Both sides recorded, against at least one side inferred. */
  byBasis: { bothRecorded: PairAggregate; someInferred: PairAggregate };
  matrix: MatrixRow[];
  /** Pairs with a complete matrix row where all test philosophers and the baseline share one pattern. */
  allSamePairs: { complete: number; allSame: number };
}

export function pairResult(row: PairRow): PairResult {
  if (row.responded === undefined || row.correct === undefined) return "missing";
  if (row.verdictBase === "none" || row.verdictVariant === "none") return "no choice";
  if (row.correct) return "correct";
  if (row.expect === "flip") return row.responded ? "wrong direction" : "no flip";
  return row.responded ? "held other answer" : "changed";
}

const patternOf = (base?: Verdict, variant?: Verdict) => (base === undefined || variant === undefined ? undefined : `${base}→${variant}`);

export function scorePairs(pairs: CasePair[], verdicts: VerdictMap, usesPivot: Record<string, boolean | undefined> = {}): PairScore {
  const rows: PairRow[] = [];
  const matrix: MatrixRow[] = [];
  for (const pair of pairs) {
    const optionIds = pair.options.map((option) => option.id);
    const pairPattern = (arm: Arm) => patternOf(verdicts[pairTaskId(pair.id, arm, "base")], verdicts[pairTaskId(pair.id, arm, "variant")]);
    const baselinePattern = pairPattern("baseline");
    for (const philosopherId of TEST_PHILOSOPHERS) {
      const entry = pair.thinkers[philosopherId];
      if (!entry) continue;
      const verdictBase = verdicts[pairTaskId(pair.id, philosopherId, "base")];
      const verdictVariant = verdicts[pairTaskId(pair.id, philosopherId, "variant")];
      const complete = verdictBase !== undefined && verdictVariant !== undefined;
      const bothOptions = complete && optionIds.includes(verdictBase) && optionIds.includes(verdictVariant);
      const pattern = pairPattern(philosopherId);
      rows.push({
        pairId: pair.id,
        philosopherId,
        expect: entry.expect,
        basis: entry.basis,
        expectedBase: entry.base,
        expectedVariant: entry.variant,
        verdictBase,
        verdictVariant,
        responded: complete ? bothOptions && (entry.expect === "flip" ? verdictBase !== verdictVariant : verdictBase === verdictVariant) : undefined,
        correct: complete ? verdictBase === entry.base && verdictVariant === entry.variant : undefined,
        pattern: pattern ?? `${verdictBase ?? "missing"}→${verdictVariant ?? "missing"}`,
        baselinePattern: baselinePattern ?? `${verdicts[pairTaskId(pair.id, "baseline", "base")] ?? "missing"}→${verdicts[pairTaskId(pair.id, "baseline", "variant")] ?? "missing"}`,
        differsFromBaseline: pattern !== undefined && baselinePattern !== undefined ? pattern !== baselinePattern : undefined,
        usesPivotBoth: usesPivot[pairTaskId(pair.id, philosopherId, "base")] === true && usesPivot[pairTaskId(pair.id, philosopherId, "variant")] === true
      });
    }
    const philosopherPatterns = TEST_PHILOSOPHERS.map(pairPattern);
    const completePatterns = philosopherPatterns.filter((pattern): pattern is string => pattern !== undefined);
    matrix.push({
      pairId: pair.id,
      patterns: Object.fromEntries(ARMS.map((arm) => [arm, pairPattern(arm) ?? "incomplete"])) as Record<Arm, string>,
      distinct: new Set(completePatterns).size,
      allSame: baselinePattern !== undefined && completePatterns.length === TEST_PHILOSOPHERS.length && completePatterns.every((pattern) => pattern === baselinePattern)
    });
  }
  const done = (list: PairRow[]) => list.filter((row) => row.correct !== undefined);
  const aggregate = (list: PairRow[]): PairAggregate => ({
    total: list.length,
    complete: done(list).length,
    correct: list.filter((row) => row.correct).length
  });
  const flipRows = rows.filter((row) => row.expect === "flip");
  const sameRows = rows.filter((row) => row.expect === "same");
  const count = (list: PairRow[], responded: boolean, correct: boolean) =>
    done(list).filter((row) => row.responded === responded && row.correct === correct).length;
  const correctRows = rows.filter((row) => row.correct);
  const recorded = (basis: PairExpectation["basis"]) => basis.base === "recorded" && basis.variant === "recorded";
  const completeMatrix = matrix.filter((row) => ARMS.every((arm) => row.patterns[arm] !== "incomplete"));
  return {
    rows,
    tasks: rows.length * 2,
    missing: rows.reduce((sum, row) => sum + (row.verdictBase === undefined ? 1 : 0) + (row.verdictVariant === undefined ? 1 : 0), 0),
    flip: { ...aggregate(flipRows), wrongDirection: count(flipRows, true, false), noFlip: done(flipRows).filter((row) => !row.responded && pairResult(row) !== "no choice").length },
    same: { ...aggregate(sameRows), heldOtherAnswer: count(sameRows, true, false), changed: done(sameRows).filter((row) => !row.responded && pairResult(row) !== "no choice").length },
    noChoice: rows.filter((row) => pairResult(row) === "no choice").length,
    correctAndDifferent: correctRows.filter((row) => row.differsFromBaseline === true).length,
    correctAndUsesPivot: correctRows.filter((row) => row.usesPivotBoth).length,
    byPhilosopher: Object.fromEntries(TEST_PHILOSOPHERS.map((id) => [id, aggregate(rows.filter((row) => row.philosopherId === id))])) as Record<TestPhilosopherId, PairAggregate>,
    byExpect: { flip: aggregate(flipRows), same: aggregate(sameRows) },
    byBasis: {
      bothRecorded: aggregate(rows.filter((row) => recorded(row.basis))),
      someInferred: aggregate(rows.filter((row) => !recorded(row.basis)))
    },
    matrix,
    allSamePairs: { complete: completeMatrix.length, allSame: completeMatrix.filter((row) => row.allSame).length }
  };
}

// ---------- axis count (from the key alone) ----------

export const KEY_AXES: KeyAxis[] = [...PRODUCTION_AXES, "impartialPartial"];

export interface AxisCount {
  splitDilemmas: number;
  /** Split dilemmas that each axis helps to decide. */
  decides: Record<KeyAxis, number>;
  /** Split dilemmas decided by this axis alone. */
  onlyThisAxis: Record<KeyAxis, number>;
  /** Split dilemmas with no axis entry. */
  noAxis: number;
}

export function axisCount(dilemmas: VerdictDilemma[]): AxisCount {
  const split = dilemmas.filter((dilemma) => dilemma.kind === "split"); // "open" dilemmas are skipped
  const zero = () => Object.fromEntries(KEY_AXES.map((axis) => [axis, 0])) as Record<KeyAxis, number>;
  const decides = zero();
  const onlyThisAxis = zero();
  let noAxis = 0;
  for (const dilemma of split) {
    const axes = [...new Set(dilemma.axes.map((entry) => entry.axis))];
    if (axes.length === 0) noAxis += 1;
    for (const axis of axes) decides[axis] += 1;
    if (axes.length === 1) onlyThisAxis[axes[0]] += 1;
  }
  return { splitDilemmas: split.length, decides, onlyThisAxis, noAxis };
}

// ---------- run-to-run variation ----------

export interface SampleAgreement {
  /** Tasks with a verdict in every sample. */
  complete: number;
  /** Complete tasks where every sample gave the same verdict. */
  stable: number;
  /** Complete tasks where the samples gave different verdicts, with the verdict of each sample. */
  unstable: { taskId: string; verdicts: Verdict[] }[];
  /** Tasks that lack a verdict in one or more samples. */
  incomplete: number;
}

/** Compare the verdicts of repeated samples of the same tasks. */
export function sampleAgreement(taskIds: string[], samples: VerdictMap[]): SampleAgreement {
  const result: SampleAgreement = { complete: 0, stable: 0, unstable: [], incomplete: 0 };
  for (const taskId of taskIds) {
    const verdicts = samples.map((sample) => sample[taskId]);
    if (verdicts.some((verdict) => verdict === undefined)) {
      result.incomplete += 1;
      continue;
    }
    result.complete += 1;
    if (new Set(verdicts).size === 1) result.stable += 1;
    else result.unstable.push({ taskId, verdicts: verdicts as Verdict[] });
  }
  return result;
}

// ---------- distinctness (no key needed) ----------

export interface ArmDistinctness {
  /** Pair sides where both this philosopher and the baseline chose an option (not "none"). */
  sides: number;
  /** Of those, sides where the philosopher chose another option than the baseline. */
  differentSides: number;
  /** Pairs where both patterns are complete and contain no "none". */
  pairs: number;
  /** Of those, pairs where the philosopher's pattern differs from the baseline's. */
  differentPatterns: number;
}

/**
 * How often each philosopher's verdict differs from the baseline verdict on the same case text.
 * It needs no answer key, so it measures the complaint directly: does the chosen philosopher change the answer?
 * A high value is not proof of fidelity (a wrong answer also differs); read it with the keyed scores.
 */
export function distinctness(pairs: CasePair[], verdicts: VerdictMap, ids: readonly TestPhilosopherId[] = TEST_PHILOSOPHERS): Record<string, ArmDistinctness> {
  const isOption = (verdict: Verdict | undefined): verdict is Verdict => verdict !== undefined && verdict !== "none";
  const result: Record<string, ArmDistinctness> = {};
  for (const id of ids) {
    const score: ArmDistinctness = { sides: 0, differentSides: 0, pairs: 0, differentPatterns: 0 };
    for (const pair of pairs) {
      const sides = (["base", "variant"] as const).map((side) => ({
        own: verdicts[pairTaskId(pair.id, id, side)],
        baseline: verdicts[pairTaskId(pair.id, "baseline", side)]
      }));
      for (const { own, baseline } of sides) {
        if (!isOption(own) || !isOption(baseline)) continue;
        score.sides += 1;
        if (own !== baseline) score.differentSides += 1;
      }
      if (sides.every(({ own, baseline }) => isOption(own) && isOption(baseline))) {
        score.pairs += 1;
        if (sides.some(({ own, baseline }) => own !== baseline)) score.differentPatterns += 1;
      }
    }
    result[id] = score;
  }
  return result;
}

/** Sum the scores of a group of philosophers. */
export function sumDistinctness(scores: Record<string, ArmDistinctness>, ids: readonly string[]): ArmDistinctness {
  return ids.reduce<ArmDistinctness>(
    (sum, id) => ({
      sides: sum.sides + scores[id].sides,
      differentSides: sum.differentSides + scores[id].differentSides,
      pairs: sum.pairs + scores[id].pairs,
      differentPatterns: sum.differentPatterns + scores[id].differentPatterns
    }),
    { sides: 0, differentSides: 0, pairs: 0, differentPatterns: 0 }
  );
}

/** Add the rates of a group of philosophers. */
export function sumRates(rates: Record<string, Rate>, ids: readonly string[]): Rate {
  return ids.reduce<Rate>((sum, id) => ({ hit: sum.hit + rates[id].hit, total: sum.total + rates[id].total }), { hit: 0, total: 0 });
}
