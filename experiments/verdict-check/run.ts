/**
 * Verdict check: generate advice with the app's prompts, have a cheap judge model say which fixed
 * option the advice recommends, and score that against the answer key.
 *
 * Usage (from the repo root):
 *   npx vite-node experiments/verdict-check/run.ts [--variant prod] [--split development|holdout|all]
 *     [--route voice|profile|pair|all] [--report-only] [--limit n] [--concurrency n] [--samples n]
 *     [--reuse-from <variant>] [--compare <variant,variant,...>]
 * Model calls use the `claude` CLI in headless mode (subscription sign-in, no API key).
 * Every output is cached in data/<variant>/, so a rerun continues where the last run stopped.
 * --samples n answers every task n times, to measure run-to-run variation. Sample 1 is data/<variant>/;
 * sample k is data/<variant>/sample-k/. With n > 1, the run also writes data/<variant>/variability-<split>.md.
 * --reuse-from v copies an answer from variant v (same sample) when the prompt is the same, instead of a new call.
 * --compare a,b,c makes no model calls: it scores the cache of each variant for each sample and writes one
 * side-by-side report, data/comparison-<split>.md. Put the original prompts (legacy) first.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPhilosophyById } from "../../shared/philosophyProfiles";
import { AXIS_POLES, CORE_PHILOSOPHERS, PHILOSOPHER_NAMES, TEST_PHILOSOPHERS, TRANSFER_PHILOSOPHERS, VERDICT_DILEMMAS, type VerdictDilemma } from "./answerKey";
import { CASE_PAIRS, type CasePair } from "./pairs";
import { buildJudgePrompt, parseJudgeReply } from "./judge";
import {
  axisCount, buildTasks, distinctness, KEY_AXES, pairResult, pairTaskId, sampleAgreement, scorePairs, scoreProfile, scoreVoice, sumDistinctness, sumRates,
  voiceTaskId, type ArmDistinctness, type PairScore, type Rate, type Task, type VerdictMap
} from "./scoring";
import { VARIANTS } from "./variants";

const HERE = dirname(fileURLToPath(import.meta.url));
const GENERATOR = { model: "claude-sonnet-5-5", effort: "medium" };
const JUDGE = { model: "claude-haiku-5-5", effort: "medium" };

// ---------- options ----------

interface Options {
  variant: string;
  split: "development" | "holdout" | "all";
  route: "voice" | "profile" | "pair" | "all";
  reportOnly: boolean;
  limit: number;
  concurrency: number;
  samples: number;
  reuseFrom?: string;
  compare?: string[];
}

function parseOptions(argv: string[]): Options {
  const options: Options = { variant: "prod", split: "development", route: "all", reportOnly: false, limit: Infinity, concurrency: 6, samples: 1 };
  const choose = <T extends string>(name: string, value: string | undefined, allowed: readonly T[]): T => {
    if (!allowed.includes(value as T)) throw new Error(`${name} must be one of: ${allowed.join(", ")}`);
    return value as T;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--report-only") options.reportOnly = true;
    else if (flag === "--variant") options.variant = (index += 1, value);
    else if (flag === "--reuse-from") options.reuseFrom = (index += 1, value);
    else if (flag === "--compare") options.compare = (index += 1, (value ?? "").split(",").map((name) => name.trim()).filter(Boolean));
    else if (flag === "--split") options.split = (index += 1, choose("--split", value, ["development", "holdout", "all"]));
    else if (flag === "--route") options.route = (index += 1, choose("--route", value, ["voice", "profile", "pair", "all"]));
    else if (flag === "--limit" || flag === "--concurrency" || flag === "--samples") {
      const number = Number(value);
      if (!Number.isInteger(number) || number < 1) throw new Error(`${flag} needs a whole number of 1 or more`);
      if (flag === "--limit") options.limit = number;
      else if (flag === "--samples") options.samples = number;
      else options.concurrency = number;
      index += 1;
    } else throw new Error(`Unknown option: ${flag}`);
  }
  for (const name of [options.variant, ...(options.reuseFrom ? [options.reuseFrom] : []), ...(options.compare ?? [])]) {
    if (!VARIANTS[name]) throw new Error(`Unknown variant "${name}". Known: ${Object.keys(VARIANTS).join(", ")}`);
  }
  if (options.compare && options.compare.length < 2) throw new Error("--compare needs two or more variants, separated by commas");
  return options;
}

// ---------- model calls ----------

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

let workdir: string | undefined;

function runProcess(command: string, args: string[], stdin: string): Promise<{ code: number; stdout: string; stderr: string }> {
  workdir ??= mkdtempSync(join(tmpdir(), "isocrateez-verdict-"));
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    // Force subscription sign-in: no API keys.
    delete env.ANTHROPIC_API_KEY;
    const child = spawn(command, args, { cwd: workdir, env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 10 * 60 * 1000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => { clearTimeout(timer); resolve({ code: code ?? -1, stdout, stderr }); });
    child.stdin.end(stdin);
  });
}

/** One user message, no tools, no settings: as near to the app's API call as the CLI allows. */
async function callClaude(model: string, effort: string, prompt: string): Promise<string> {
  const { code, stdout, stderr } = await runProcess("claude", [
    "-p", "--model", model, "--effort", effort,
    "--system-prompt", "", "--tools", "", "--setting-sources", "",
    "--strict-mcp-config", "--disable-slash-commands", "--no-session-persistence",
    "--output-format", "json"
  ], prompt);
  if (code !== 0) throw new Error(`claude exited ${code}: ${(stderr || stdout).slice(0, 400)}`);
  const parsed = JSON.parse(stdout) as { result?: string; is_error?: boolean };
  if (parsed.is_error || !parsed.result) throw new Error(`claude returned an error: ${stdout.slice(0, 400)}`);
  return parsed.result;
}

async function withRetry<T>(label: string, action: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      console.error(`  ! ${label} attempt ${attempt} failed: ${String(error).slice(0, 200)}`);
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 15000));
    }
  }
  throw lastError;
}

async function pool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: concurrency }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await worker(item);
  }));
}

// ---------- cache ----------

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}

interface AdviceFile { promptHash: string; model: string; prompt: string; text: string }
interface JudgmentFile { inputHash: string; model: string; verdict: string; conditional: boolean; usesPivot?: boolean; evidence: string; raw: string }

// ---------- tasks ----------

/** The case: a dilemma or a pair. Gives the text to show the advisor and the options for the judge. */
type Case = Pick<VerdictDilemma, "options"> & { text: string; pivot?: string };

function promptFor(task: Task, text: string, variant: string): string {
  const prompts = VARIANTS[variant];
  if (task.route === "profile") return prompts.profile({ dilemma: text, profile: task.profile });
  if (task.route === "pair" && task.arm === "baseline") return prompts.baseline({ dilemma: text });
  const id = task.route === "pair" ? task.arm : task.philosopherId;
  const voice = getPhilosophyById(id);
  if (!voice) throw new Error(`No philosophy profile with id ${id}`);
  return prompts.voice({ dilemma: text, voice });
}

interface Counts { run: number; cached: number; failed: number; invalid: number; reused: number }
const newCounts = (): Counts => ({ run: 0, cached: 0, failed: 0, invalid: 0, reused: 0 });

interface Outcome {
  verdicts: VerdictMap;
  conditional: Record<string, boolean>;
  usesPivot: Record<string, boolean | undefined>;
  advice: Counts;
  judge: Counts;
  failures: string[];
}

/** The data folder of one sample. Sample 1 is the variant folder itself, so older caches count as sample 1. */
function sampleDir(variant: string, sample: number): string {
  const base = join(HERE, "data", variant);
  return sample === 1 ? base : join(base, `sample-${sample}`);
}

async function processTask(task: Task, dilemma: Case, options: Options, dataDir: string, outcome: Outcome, reuseDir?: string) {
  const prompt = promptFor(task, dilemma.text, options.variant);
  const promptHash = sha256(prompt);

  // Advice
  const advicePath = join(dataDir, "advice", `${task.id}.json`);
  let advice = readJson<AdviceFile>(advicePath);
  let reused = false;
  if ((!advice || advice.promptHash !== promptHash) && reuseDir && !options.reportOnly) {
    // Same prompt in another variant: copy its answer and judgment, so both variants share one sample.
    const other = readJson<AdviceFile>(join(reuseDir, "advice", `${task.id}.json`));
    if (other && other.promptHash === promptHash) {
      writeJson(advicePath, other);
      const otherJudgment = readJson<JudgmentFile>(join(reuseDir, "judgments", `${task.id}.json`));
      if (otherJudgment) writeJson(join(dataDir, "judgments", `${task.id}.json`), otherJudgment);
      advice = other;
      reused = true;
      outcome.advice.reused += 1;
    }
  }
  if (advice && advice.promptHash === promptHash) {
    if (!reused) outcome.advice.cached += 1;
  } else {
    advice = null;
    if (options.reportOnly) return;
    try {
      const started = Date.now();
      const text = await withRetry(`advice ${task.id}`, () => callClaude(GENERATOR.model, GENERATOR.effort, prompt));
      advice = { promptHash, model: GENERATOR.model, prompt, text };
      writeJson(advicePath, advice);
      outcome.advice.run += 1;
      const sampleTag = dataDir === sampleDir(options.variant, 1) ? "" : `${basename(dataDir)}/`;
      console.log(`  ${sampleTag}advice/${task.id}  (${((Date.now() - started) / 1000).toFixed(0)} s)`);
    } catch (error) {
      outcome.advice.failed += 1;
      outcome.failures.push(`advice ${task.id}: ${String(error).slice(0, 200)}`);
      return;
    }
  }

  // Judgment
  const judgePrompt = buildJudgePrompt(dilemma.text, dilemma.options, advice.text, dilemma.pivot);
  const inputHash = sha256(judgePrompt);
  const judgmentPath = join(dataDir, "judgments", `${task.id}.json`);
  const optionIds = dilemma.options.map((option) => option.id);
  let judgment = readJson<JudgmentFile>(judgmentPath);
  if (judgment && judgment.inputHash === inputHash && judgment.verdict !== "invalid") {
    outcome.judge.cached += 1;
  } else if (judgment && judgment.inputHash === inputHash && options.reportOnly) {
    outcome.judge.cached += 1; // an invalid verdict, kept as it is
  } else {
    judgment = null;
    if (options.reportOnly) return;
    try {
      let raw = "";
      let parsed = null;
      // One retry if the reply cannot be parsed.
      for (let attempt = 1; attempt <= 2 && !parsed; attempt += 1) {
        raw = await withRetry(`judge ${task.id}`, () => callClaude(JUDGE.model, JUDGE.effort, judgePrompt));
        parsed = parseJudgeReply(raw, optionIds);
      }
      judgment = parsed
        ? { inputHash, model: JUDGE.model, ...parsed, raw }
        : { inputHash, model: JUDGE.model, verdict: "invalid", conditional: false, evidence: "", raw };
      writeJson(judgmentPath, judgment);
      outcome.judge.run += 1;
    } catch (error) {
      outcome.judge.failed += 1;
      outcome.failures.push(`judge ${task.id}: ${String(error).slice(0, 200)}`);
      return;
    }
  }
  if (judgment.verdict === "invalid") {
    outcome.judge.invalid += 1; // counts as missing in scoring
    return;
  }
  outcome.verdicts[task.id] = judgment.verdict;
  outcome.conditional[task.id] = judgment.conditional;
  outcome.usesPivot[task.id] = judgment.usesPivot;
}

// ---------- report ----------

const arrow = (pattern: string) => pattern.replace("→", " → ");
const pct = ({ hit, total }: Rate) => (total === 0 ? "n/a (0 of 0)" : `${((100 * hit) / total).toFixed(0)}% (${hit} of ${total})`);

function table(header: string[], rows: string[][]): string[] {
  return [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${row.join(" | ")} |`)];
}

function renderReport(options: Options, sample: number, dilemmas: VerdictDilemma[], pairs: CasePair[], tasks: Task[], outcome: Outcome): string {
  const pairById = new Map(pairs.map((pair) => [pair.id, pair]));
  const voice = scoreVoice(dilemmas, outcome.verdicts);
  const pairScore = scorePairs(pairs, outcome.verdicts, outcome.usesPivot);
  const profile = scoreProfile(dilemmas, outcome.verdicts);
  const axes = axisCount(dilemmas);
  const names = NAMES;
  const voiceTasks = tasks.filter((task) => task.route === "voice").length;
  const pairTasks = tasks.filter((task) => task.route === "pair").length;
  const profileTasks = tasks.length - voiceTasks - pairTasks;
  const lines: string[] = [
    `# Verdict check report`,
    "",
    `- Date: ${new Date().toISOString().slice(0, 10)}`,
    `- Variant: ${options.variant}`,
    `- Split: ${options.split}`,
    `- Sample: ${sample}`,
    `- Route: ${options.route}${options.limit < Infinity ? ` (limit ${options.limit} tasks)` : ""}${options.reportOnly ? " (report only, no model calls)" : ""}`,
    `- Advice model: ${GENERATOR.model} (effort ${GENERATOR.effort})`,
    `- Judge model: ${JUDGE.model} (effort ${JUDGE.effort})`,
    `- Tasks in this report: ${tasks.length} (${voiceTasks} voice, ${profileTasks} profile, ${pairTasks} pair)`,
    `- Advice: ${outcome.advice.run} run, ${outcome.advice.cached} cached, ${outcome.advice.reused} copied from ${options.reuseFrom ?? "-"}, ${outcome.advice.failed} failed`,
    `- Judgments: ${outcome.judge.run} run, ${outcome.judge.cached} cached, ${outcome.judge.failed} failed, ${outcome.judge.invalid} invalid`,
    `- Tasks with no usable verdict yet: ${tasks.length - Object.keys(outcome.verdicts).length}`,
    ""
  ];

  if (options.route === "voice" || options.route === "all") {
    lines.push(
      "## Voice route: aggregates", "",
      `- Match with the key, all entries: ${pct(voice.matchOverall)}`,
      `- Match with the key, "clear" entries only: ${pct(voice.matchClear)}`,
      `- Match, core four: ${pct(sumRates(voice.matchByPhilosopher, CORE_PHILOSOPHERS))}`,
      `- Match, transfer thinkers: ${pct(sumRates(voice.matchByPhilosopher, TRANSFER_PHILOSOPHERS))}`,
      ...TEST_PHILOSOPHERS.map((id) => `- Match, ${names[id]}: ${pct(voice.matchByPhilosopher[id])}`),
      `- "none" verdicts: ${pct(voice.noneVerdicts)}`,
      `- Voice tasks with no verdict: ${voice.missing} of ${voice.tasks}`,
      `- Open entries in the split dilemmas (not scored): ${voice.split.openEntries}`,
      `- Agreement dilemmas where every keyed philosopher got the expected option: ${voice.agreement.allExpected} of ${voice.agreement.complete} complete (${voice.agreement.dilemmas} in the split)`,
      "",
      "## Voice route: verdicts", "",
      "Marks: ✓ match, ✗ mismatch, open = the reviewer judged the texts do not settle the case (not scored), · = no key entry. ? = the key entry is disputed. * = the judge flagged the advice as conditional.", ""
    );
    const shown = dilemmas.filter((dilemma) => dilemma.kind !== "open");
    lines.push(`Dilemmas of kind "open" (nothing scored, not listed): ${dilemmas.length - shown.length}.`, "");
    lines.push(...table(["dilemma", "kind", ...TEST_PHILOSOPHERS.map((id) => names[id])], shown.map((dilemma) => [
      dilemma.id,
      dilemma.kind,
      ...TEST_PHILOSOPHERS.map((id) => {
        const row = voice.rows.find((candidate) => candidate.dilemmaId === dilemma.id && candidate.philosopherId === id);
        if (!row) return dilemma.open?.[id] !== undefined ? "open" : "·";
        const mark = row.match === undefined ? "" : row.match ? "✓" : "✗";
        const flags = (row.expected?.confidence === "disputed" ? "?" : "") + (outcome.conditional[`voice__${dilemma.id}__${id}`] ? "*" : "");
        return `${row.verdict ?? "missing"} ${mark}${flags}`.trim();
      })
    ])), "");
  }

  if (options.route === "pair" || options.route === "all") {
    const share = (a: { correct: number; complete: number; total: number }) => `${pct({ hit: a.correct, total: a.complete })}, ${a.total} rows`;
    const { flip, same } = pairScore;
    lines.push(
      "## Pairs: aggregates", "",
      "A row is complete when both verdicts exist. Percentages count complete rows only.", "",
      `- Flip rows, correct: ${share(flip)}`,
      `- Flip rows, wrong direction (both verdicts are options, they differ, not as expected): ${flip.wrongDirection}`,
      `- Flip rows, no flip (verdict stayed): ${flip.noFlip}`,
      `- Same rows, correct: ${share(same)}`,
      `- Same rows, held another answer than expected: ${same.heldOtherAnswer}`,
      `- Same rows, changed (verdict changed): ${same.changed}`,
      `- Rows with a "none" verdict (no choice): ${pairScore.noChoice}`,
      ...TEST_PHILOSOPHERS.map((id) => `- Correct, ${names[id]}: ${share(pairScore.byPhilosopher[id])}`),
      `- Correct, flip rows: ${share(pairScore.byExpect.flip)}`,
      `- Correct, same rows: ${share(pairScore.byExpect.same)}`,
      `- Correct, both sides recorded: ${share(pairScore.byBasis.bothRecorded)}`,
      `- Correct, at least one side inferred: ${share(pairScore.byBasis.someInferred)}`,
      `- Correct rows that differ from the baseline pattern: ${pairScore.correctAndDifferent} of ${pairScore.flip.correct + pairScore.same.correct}`,
      `- Correct rows where the judge says both sides use the pivot fact: ${pairScore.correctAndUsesPivot} of ${pairScore.flip.correct + pairScore.same.correct}`,
      `- Pairs where all ${TEST_PHILOSOPHERS.length} philosophers and the baseline have the same pattern: ${pairScore.allSamePairs.allSame} of ${pairScore.allSamePairs.complete} pairs with all verdicts`,
      `- Keyed-thinker tasks with no verdict: ${pairScore.missing} of ${pairScore.tasks}`,
      "",
      "## Distinctness (no key needed)", "",
      "For each philosopher: on how many pair sides the verdict differs from the baseline verdict on the same text (sides where either chose no option are left out), and in how many pairs the pattern differs.", "",
      ...table(["philosopher", "sides that differ", "patterns that differ"], (() => {
        const scores = distinctness(pairs, outcome.verdicts);
        const row = (label: string, d: ArmDistinctness) => [label, `${d.differentSides} of ${d.sides}`, `${d.differentPatterns} of ${d.pairs}`];
        return [
          ...TEST_PHILOSOPHERS.map((id) => row(names[id], scores[id])),
          row("core four", sumDistinctness(scores, CORE_PHILOSOPHERS)),
          row("transfer thinkers", sumDistinctness(scores, TRANSFER_PHILOSOPHERS))
        ];
      })()),
      "",
      "## Pairs: verdicts", "",
      "* = the judge flagged the advice as conditional.", "",
      ...table(["pair", "thinker", "expect", "basis", "expected base → variant", "verdict base → variant", "baseline", "result", "differs from baseline", "uses pivot"], pairScore.rows.map((row) => {
        const star = (side: "base" | "variant") => (outcome.conditional[pairTaskId(row.pairId, row.philosopherId, side)] ? "*" : "");
        return [
          row.pairId, names[row.philosopherId], row.expect, `${row.basis.base}/${row.basis.variant}`,
          `${row.expectedBase} → ${row.expectedVariant}`,
          `${row.verdictBase ?? "missing"}${star("base")} → ${row.verdictVariant ?? "missing"}${star("variant")}`,
          arrow(row.baselinePattern),
          pairResult(row),
          row.differsFromBaseline === undefined ? "-" : row.differsFromBaseline ? "yes" : "no",
          row.usesPivotBoth ? "yes" : "no"
        ];
      })),
      "",
      "## Pairs: matrix", "",
      "Pattern of each arm, base → variant. (key) marks a keyed thinker. Distinct patterns: among the test philosophers, complete patterns only.", "",
      ...table(["pair", "baseline", ...TEST_PHILOSOPHERS.map((id) => names[id]), "distinct patterns"], pairScore.matrix.map((row) => {
        const keyed = pairById.get(row.pairId)?.thinkers;
        return [
          row.pairId, arrow(row.patterns.baseline),
          ...TEST_PHILOSOPHERS.map((id) => `${arrow(row.patterns[id])}${keyed?.[id] ? " (key)" : ""}`),
          String(row.distinct)
        ];
      })),
      ""
    );
  }

  if (options.route === "profile" || options.route === "all") {
    const line = (label: string, a: { pairs: number; complete: number; bothMatch: number; differs: number }) =>
      `- ${label}: ${a.pairs} pairs, ${a.complete} complete; both poles match the key: ${a.bothMatch}; the two poles differ: ${a.differs}`;
    lines.push(
      "## Profile route: aggregates", "",
      line("All axes", profile.overall),
      ...(Object.keys(profile.byAxis) as (keyof typeof profile.byAxis)[]).map((axis) => line(axis, profile.byAxis[axis])),
      `- Profile tasks with no verdict: ${profile.missing} of ${profile.tasks}`,
      "",
      "## Profile route: verdicts", "",
      ...table(["dilemma", "axis", "expected neg", "expected pos", "verdict neg", "verdict pos", "bothMatch", "differs"], profile.rows.map((row) => [
        row.dilemmaId, row.axis, row.expectedNeg, row.expectedPos, row.verdictNeg ?? "missing", row.verdictPos ?? "missing",
        row.bothMatch === undefined ? "-" : row.bothMatch ? "yes" : "no",
        row.differs === undefined ? "-" : row.differs ? "yes" : "no"
      ])),
      ""
    );
  }

  lines.push(
    "## Axis count (from the key alone)", "",
    `Split dilemmas in this split: ${axes.splitDilemmas}. With no axis entry: ${axes.noAxis}.`, "",
    ...table(["axis", "negative to positive", "decides", "decides alone"], KEY_AXES.map((axis) => [
      axis, `${AXIS_POLES[axis].negative} to ${AXIS_POLES[axis].positive}`, String(axes.decides[axis]), String(axes.onlyThisAxis[axis])
    ])),
    ""
  );
  if (outcome.failures.length) lines.push("## Failures", "", ...outcome.failures.map((failure) => `- ${failure}`), "");
  return lines.join("\n");
}

const NAMES: Record<string, string> = PHILOSOPHER_NAMES;

/**
 * One side-by-side report of several variants, each with the same number of samples, on the same tasks.
 * Each cell lists the samples in order ("s1 / s2 / s3"), so the spread between samples is visible next to
 * the difference between variants.
 */
function renderComparison(options: Options, dilemmas: VerdictDilemma[], pairs: CasePair[], tasks: Task[], byVariant: Record<string, Outcome[]>): string {
  const variants = Object.keys(byVariant);
  const frac = (hit: number, total: number) => `${hit}/${total}`;
  const cells = (measure: (outcome: Outcome) => string) => variants.map((variant) => byVariant[variant].map(measure).join(" / "));
  const rows: string[][] = [];
  const add = (label: string, measure: (outcome: Outcome) => string) => rows.push([label, ...cells(measure)]);
  const route = (name: Task["route"]) => options.route === "all" || options.route === name;
  const memo = new Map<Outcome, { pair: PairScore }>();
  const pairOf = (outcome: Outcome) => {
    if (!memo.has(outcome)) memo.set(outcome, { pair: scorePairs(pairs, outcome.verdicts, outcome.usesPivot) });
    return memo.get(outcome)!.pair;
  };
  const group = (ids: readonly string[]) => (row: { philosopherId: string }) => ids.includes(row.philosopherId);
  const pairCount = (outcome: Outcome, ids: readonly string[], expect: "flip" | "same") => {
    const list = pairOf(outcome).rows.filter(group(ids)).filter((row) => row.expect === expect && row.correct !== undefined);
    return frac(list.filter((row) => row.correct).length, list.length);
  };

  if (route("voice")) {
    const voice = (outcome: Outcome) => scoreVoice(dilemmas, outcome.verdicts);
    const rateCell = (rate: Rate) => frac(rate.hit, rate.total);
    add("Voice: match with the key, core four", (o) => rateCell(sumRates(voice(o).matchByPhilosopher, CORE_PHILOSOPHERS)));
    for (const id of CORE_PHILOSOPHERS) add(`Voice: ${NAMES[id]}`, (o) => rateCell(voice(o).matchByPhilosopher[id]));
    add("Voice: match with the key, transfer thinkers", (o) => rateCell(sumRates(voice(o).matchByPhilosopher, TRANSFER_PHILOSOPHERS)));
    for (const id of TRANSFER_PHILOSOPHERS) add(`Voice: ${NAMES[id]}`, (o) => rateCell(voice(o).matchByPhilosopher[id]));
    add('Voice: "none" verdicts', (o) => rateCell(voice(o).noneVerdicts));
  }
  if (route("profile")) {
    add("Profile: both poles match the key", (o) => { const p = scoreProfile(dilemmas, o.verdicts).overall; return frac(p.bothMatch, p.complete); });
    add("Profile: the two poles differ", (o) => { const p = scoreProfile(dilemmas, o.verdicts).overall; return frac(p.differs, p.complete); });
  }
  if (route("pair")) {
    add("Pairs: flip rows correct, core four", (o) => pairCount(o, CORE_PHILOSOPHERS, "flip"));
    add("Pairs: flip rows correct, transfer thinkers", (o) => pairCount(o, TRANSFER_PHILOSOPHERS, "flip"));
    add("Pairs: same rows correct, core four", (o) => pairCount(o, CORE_PHILOSOPHERS, "same"));
    add("Pairs: same rows correct, transfer thinkers", (o) => pairCount(o, TRANSFER_PHILOSOPHERS, "same"));
    for (const [label, ids] of [["core four", CORE_PHILOSOPHERS], ["transfer thinkers", TRANSFER_PHILOSOPHERS]] as const) {
      add(`Pairs: correct rows that differ from the baseline, ${label}`, (o) => {
        const correct = pairOf(o).rows.filter(group(ids)).filter((row) => row.correct);
        return frac(correct.filter((row) => row.differsFromBaseline).length, correct.length);
      });
    }
    add(`Pairs: all ${TEST_PHILOSOPHERS.length} philosophers and the baseline give one pattern`, (o) => frac(pairOf(o).allSamePairs.allSame, pairOf(o).allSamePairs.complete));
  }
  add("Tasks with no verdict", (o) => String(tasks.length - Object.keys(o.verdicts).length));

  const distinctRows: string[][] = [];
  if (route("pair")) {
    const dCell = (pick: (scores: Record<string, ArmDistinctness>) => ArmDistinctness) =>
      variants.map((variant) => byVariant[variant].map((o) => { const d = pick(distinctness(pairs, o.verdicts)); return frac(d.differentSides, d.sides); }).join(" / "));
    for (const id of TEST_PHILOSOPHERS) distinctRows.push([NAMES[id], ...dCell((scores) => scores[id])]);
    distinctRows.push(["core four", ...dCell((scores) => sumDistinctness(scores, CORE_PHILOSOPHERS))]);
    distinctRows.push(["transfer thinkers", ...dCell((scores) => sumDistinctness(scores, TRANSFER_PHILOSOPHERS))]);
  }

  // Keyed rows: how many samples got each one right.
  const keyedRows: string[][] = [];
  const n = (variant: string) => byVariant[variant].length;
  if (route("voice")) {
    for (const dilemma of dilemmas) {
      for (const id of TEST_PHILOSOPHERS) {
        const expected = dilemma.philosophers[id];
        if (!expected) continue;
        const taskId = voiceTaskId(dilemma.id, id);
        keyedRows.push([dilemma.id, NAMES[id], `${expected.option}${expected.confidence === "disputed" ? " ?" : ""}`, ...variants.map((variant) => {
          const verdicts = byVariant[variant].map((o) => o.verdicts[taskId]);
          const hits = verdicts.filter((verdict) => verdict !== undefined && (verdict === expected.option || (expected.alsoAccept ?? []).includes(verdict))).length;
          return `${hits} of ${n(variant)}`;
        })]);
      }
    }
  }
  if (route("pair")) {
    for (const pair of pairs) {
      for (const id of TEST_PHILOSOPHERS) {
        const entry = pair.thinkers[id];
        if (!entry) continue;
        keyedRows.push([pair.id, NAMES[id], `${entry.base} → ${entry.variant}`, ...variants.map((variant) => {
          const own = byVariant[variant].map((o) => pairOf(o).rows.find((row) => row.pairId === pair.id && row.philosopherId === id));
          const hits = own.filter((row) => row?.correct).length;
          const differs = own.filter((row) => row?.correct && row.differsFromBaseline).length;
          return `${hits} of ${n(variant)} (${differs} differ)`;
        })]);
      }
    }
  }

  const header = ["measure", ...variants.map((variant) => `${variant} (${byVariant[variant].length} samples)`)];
  return [
    "# Verdict check: comparison of prompt variants", "",
    `- Date: ${new Date().toISOString().slice(0, 10)}`,
    `- Split: ${options.split}. Route: ${options.route}.`,
    `- Variants: ${variants.join(", ")}. legacy = the original prompts (until 2026-11-21); prod = the current prompts; notes = prod with the lens notes (core four only).`,
    `- Advice model: ${GENERATOR.model} (effort ${GENERATOR.effort}); judge: ${JUDGE.model} (effort ${JUDGE.effort}). Scored from the cache: no model calls.`,
    `- Core four: ${CORE_PHILOSOPHERS.map((id) => NAMES[id]).join(", ")}. Transfer thinkers: ${TRANSFER_PHILOSOPHERS.map((id) => NAMES[id]).join(", ")} (no lens notes in any variant).`, "",
    "How to read: each cell gives the samples in order, \"sample 1 / sample 2 / sample 3\", as hits/total. A difference between two variants that is no larger than the spread between samples is not evidence. Every variant has its own baseline (the same prompt with no philosopher).", "",
    "## Main scores", "",
    ...table(header, rows), "",
    ...(distinctRows.length ? [
      "## Distinctness (no key needed)", "",
      "Pair sides where the philosopher's verdict differs from the baseline verdict on the same text. Sides where either chose no option are left out. This measures the professor's complaint directly: does the chosen philosopher change the answer? A high value is not proof of fidelity, because a wrong answer also differs; read it with the keyed scores.", "",
      ...table(["philosopher", ...header.slice(1)], distinctRows), ""
    ] : []),
    "## Keyed rows: samples that match the key", "",
    "Voice rows: single dilemmas. Pair rows: both sides correct; \"differ\" = correct and different from the baseline pattern in that sample. ? = disputed key entry.", "",
    ...table(["case", "thinker", "expected", ...header.slice(1)], keyedRows), ""
  ].join("\n");
}

/** Compare the samples: main scores side by side, then the tasks whose verdict changed between samples. */
function renderVariability(options: Options, dilemmas: VerdictDilemma[], pairs: CasePair[], tasks: Task[], outcomes: Outcome[]): string {
  const sampleHeader = outcomes.map((_, index) => `sample ${index + 1}`);
  const rows: string[][] = [];
  const add = (label: string, values: string[]) => rows.push([label, ...values]);
  const route = (name: Task["route"]) => options.route === "all" || options.route === name;

  if (route("voice")) {
    const voice = outcomes.map((outcome) => scoreVoice(dilemmas, outcome.verdicts));
    add("Voice: match with the key", voice.map((score) => pct(score.matchOverall)));
    for (const id of TEST_PHILOSOPHERS) add(`Voice: ${NAMES[id]}`, voice.map((score) => pct(score.matchByPhilosopher[id])));
    add('Voice: "none" verdicts', voice.map((score) => pct(score.noneVerdicts)));
  }
  if (route("profile")) {
    const profile = outcomes.map((outcome) => scoreProfile(dilemmas, outcome.verdicts));
    add("Profile: both poles match the key", profile.map((score) => `${score.overall.bothMatch} of ${score.overall.complete}`));
    add("Profile: the two poles differ", profile.map((score) => `${score.overall.differs} of ${score.overall.complete}`));
  }
  if (route("pair")) {
    const pair = outcomes.map((outcome) => scorePairs(pairs, outcome.verdicts, outcome.usesPivot));
    add("Pairs: flip rows correct", pair.map((score) => `${score.flip.correct} of ${score.flip.complete}`));
    add("Pairs: same rows correct", pair.map((score) => `${score.same.correct} of ${score.same.complete}`));
    add("Pairs: correct rows that differ from the baseline", pair.map((score) => `${score.correctAndDifferent} of ${score.flip.correct + score.same.correct}`));
  }
  add("Tasks with no verdict", outcomes.map((outcome) => String(tasks.length - Object.keys(outcome.verdicts).length)));

  const samples = outcomes.map((outcome) => outcome.verdicts);
  const all = sampleAgreement(tasks.map((task) => task.id), samples);
  const byRoute = (["voice", "profile", "pair"] as const)
    .filter((name) => route(name))
    .map((name) => {
      const agreement = sampleAgreement(tasks.filter((task) => task.route === name).map((task) => task.id), samples);
      return `- ${name}: ${pct({ hit: agreement.stable, total: agreement.complete })}`;
    });

  return [
    "# Verdict check: run-to-run variation", "",
    `- Date: ${new Date().toISOString().slice(0, 10)}`,
    `- Variant: ${options.variant}`,
    `- Split: ${options.split}`,
    `- Route: ${options.route}${options.limit < Infinity ? ` (limit ${options.limit} tasks)` : ""}`,
    `- Samples: ${outcomes.length}. Each sample answers every task one time, with the same prompt.`,
    `- Advice model: ${GENERATOR.model} (effort ${GENERATOR.effort}); judge: ${JUDGE.model} (effort ${JUDGE.effort})`, "",
    "A difference between two prompt variants that is no larger than the spread between these samples is not evidence that one variant is better.", "",
    "## Main scores, sample by sample", "",
    ...table(["measure", ...sampleHeader], rows), "",
    "## Same verdict in every sample", "",
    `- All tasks: ${pct({ hit: all.stable, total: all.complete })}`,
    ...byRoute,
    `- Tasks without a verdict in one or more samples (not compared): ${all.incomplete}`, "",
    "## Tasks whose verdict changed", "",
    ...(all.unstable.length
      ? table(["task", ...sampleHeader], all.unstable.map((row) => [row.taskId, ...row.verdicts]))
      : ["None."]),
    ""
  ].join("\n");
}

// ---------- main ----------

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const dilemmas = VERDICT_DILEMMAS.filter((dilemma) => options.split === "all" || dilemma.split === options.split);
  const dilemmaById = new Map(dilemmas.map((dilemma) => [dilemma.id, dilemma]));
  const pairs = CASE_PAIRS.filter((pair) => options.split === "all" || pair.split === options.split);
  const pairById = new Map(pairs.map((pair) => [pair.id, pair]));
  const tasks = buildTasks(dilemmas, pairs).filter((task) => options.route === "all" || task.route === options.route).slice(0, options.limit);
  const limited = options.limit < Infinity;
  const reportDilemmas = limited ? dilemmas.filter((dilemma) => tasks.some((task) => "dilemmaId" in task && task.dilemmaId === dilemma.id)) : dilemmas;
  const reportPairs = limited ? pairs.filter((pair) => tasks.some((task) => task.route === "pair" && task.pairId === pair.id)) : pairs;

  const sourceFor = (task: Task): Case => task.route === "pair"
    ? { text: task.text, options: pairById.get(task.pairId)!.options, pivot: pairById.get(task.pairId)!.pivot }
    : dilemmaById.get(task.dilemmaId)!;

  if (options.compare) {
    const byVariant: Record<string, Outcome[]> = {};
    for (const variant of options.compare) {
      byVariant[variant] = [];
      for (let sample = 1; sample <= options.samples; sample += 1) {
        const outcome: Outcome = { verdicts: {}, conditional: {}, usesPivot: {}, advice: newCounts(), judge: newCounts(), failures: [] };
        const variantOptions: Options = { ...options, variant, reportOnly: true };
        await pool(tasks, options.concurrency, (task) => processTask(task, sourceFor(task), variantOptions, sampleDir(variant, sample), outcome));
        byVariant[variant].push(outcome);
      }
    }
    const report = renderComparison(options, reportDilemmas, reportPairs, tasks, byVariant);
    const file = join(HERE, "data", `comparison-${options.split}.md`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, report + "\n");
    console.log(report);
    console.log(`Comparison saved to ${file}`);
    return;
  }

  const outcomes: Outcome[] = [];
  for (let sample = 1; sample <= options.samples; sample += 1) {
    const dataDir = sampleDir(options.variant, sample);
    const outcome: Outcome = { verdicts: {}, conditional: {}, usesPivot: {}, advice: newCounts(), judge: newCounts(), failures: [] };
    console.log(`Variant ${options.variant}, split ${options.split}, route ${options.route}, sample ${sample} of ${options.samples}: ${tasks.length} tasks${options.reportOnly ? " (report only)" : ""}`);
    await pool(tasks, options.concurrency, (task) => {
      const source: Case = task.route === "pair"
        ? { text: task.text, options: pairById.get(task.pairId)!.options, pivot: pairById.get(task.pairId)!.pivot }
        : dilemmaById.get(task.dilemmaId)!;
      return processTask(task, source, options, dataDir, outcome, options.reuseFrom ? sampleDir(options.reuseFrom, sample) : undefined);
    });
    outcomes.push(outcome);

    const report = renderReport(options, sample, reportDilemmas, reportPairs, tasks, outcome);
    const file = join(dataDir, `report-${options.split}.md`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, report + "\n");
    if (options.samples === 1) console.log("\n" + report);
    console.log(`Report saved to ${file}`);
  }

  if (options.samples > 1) {
    const variability = renderVariability(options, reportDilemmas, reportPairs, tasks, outcomes);
    const file = join(sampleDir(options.variant, 1), `variability-${options.split}.md`);
    writeFileSync(file, variability + "\n");
    console.log("\n" + variability);
    console.log(`Variation report saved to ${file}`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
