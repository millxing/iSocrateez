/**
 * Runner for the reasoning test (see reasoning.ts).
 *
 * Usage (from the repo root):
 *   npx vite-node experiments/verdict-check/reasoningRun.ts --variants legacy,prod,contrast
 *     [--sample 1] [--stage outline|judge|report|all] [--concurrency 6]
 * Reads the cached advice and verdicts of each variant (development split, voice route). Writes
 * data/<variant>/reasoning/ (outlines and judgments, cached by input hash) and data/reasoning-development.md.
 * Outline writer: GPT 6.2 Sol (Codex CLI). Judges: GPT 6.1 Terra (Codex CLI) and Claude Sonnet 5.5 (claude CLI).
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { TEST_PHILOSOPHERS, VERDICT_DILEMMAS } from "./answerKey";
import { callClaude, callCodex, pool, readJson, sha256, withRetry, writeJson } from "./cli";
import {
  authorName, buildGroups, findLeaks, judgePrompt, outlinePrompt, parseJudge, scoreGroup,
  type Arm, type GroupScore, type ReasoningGroup
} from "./reasoning";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTLINER = { label: "gpt-6.2-sol", call: (prompt: string) => callCodex("gpt-6.2-sol", "low", prompt) };
const JUDGES = [
  { label: "gpt-6.1-terra", call: (prompt: string) => callCodex("gpt-6.1-terra", "medium", prompt) },
  { label: "claude-sonnet-5-5", call: (prompt: string) => callClaude("claude-sonnet-5-5", "medium", prompt) }
];
const ARMS: Arm[] = ["baseline", ...TEST_PHILOSOPHERS];
const DILEMMAS = VERDICT_DILEMMAS.filter((d) => d.split === "development" && d.kind !== "open");

interface Options { variants: string[]; sample: number; stage: string; concurrency: number }

function parseOptions(argv: string[]): Options {
  const options: Options = { variants: ["legacy", "prod", "contrast"], sample: 1, stage: "all", concurrency: 6 };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i + 1];
    if (argv[i] === "--variants") { options.variants = value.split(","); i += 1; }
    else if (argv[i] === "--sample") { options.sample = Number(value); i += 1; }
    else if (argv[i] === "--stage") { options.stage = value; i += 1; }
    else if (argv[i] === "--concurrency") { options.concurrency = Number(value); i += 1; }
    else throw new Error(`Unknown option ${argv[i]}`);
  }
  return options;
}

const sampleDir = (variant: string, sample: number) =>
  sample === 1 ? join(HERE, "data", variant) : join(HERE, "data", variant, `sample-${sample}`);

interface OutlineFile { inputHash: string; model: string; text: string; leaks: string[]; attempts: number }
interface JudgeFile { inputHash: string; model: string; raw: string }

function groupsFor(variant: string, sample: number): ReasoningGroup[] {
  const dir = sampleDir(variant, sample);
  return buildGroups(DILEMMAS, (dilemmaId, arm) =>
    readJson<{ verdict: string }>(join(dir, "judgments", `voice__${dilemmaId}__${arm}.json`))?.verdict ?? null, ARMS);
}

const adviceText = (variant: string, sample: number, dilemmaId: string, arm: Arm) =>
  readJson<{ text: string }>(join(sampleDir(variant, sample), "advice", `voice__${dilemmaId}__${arm}.json`))?.text ?? null;

const outlinePath = (variant: string, sample: number, dilemmaId: string, arm: Arm) =>
  join(sampleDir(variant, sample), "reasoning", `outline__${dilemmaId}__${arm}.json`);

/** Writes the outline; on a leak, asks once more with the leaked words named. */
async function makeOutline(variant: string, sample: number, dilemmaId: string, arm: Arm): Promise<void> {
  const dilemma = DILEMMAS.find((d) => d.id === dilemmaId)!;
  const advice = adviceText(variant, sample, dilemmaId, arm);
  if (!advice) throw new Error(`no advice for ${variant} ${dilemmaId} ${arm}`);
  const prompt = outlinePrompt(dilemma, advice);
  const inputHash = sha256(`${OUTLINER.label}\n${prompt}`);
  const path = outlinePath(variant, sample, dilemmaId, arm);
  if (readJson<OutlineFile>(path)?.inputHash === inputHash) return;
  let text = await withRetry(`outline ${variant} ${dilemmaId} ${arm}`, () => OUTLINER.call(prompt));
  let leaks = findLeaks(text);
  let attempts = 1;
  if (leaks.length > 0) {
    const retry = `${prompt}\n\nYour first outline used these words, which are not allowed: ${leaks.join(", ")}. Write the outline again without them.`;
    text = await withRetry(`outline-retry ${variant} ${dilemmaId} ${arm}`, () => OUTLINER.call(retry));
    leaks = findLeaks(text);
    attempts = 2;
  }
  writeJson(path, { inputHash, model: OUTLINER.label, text, leaks, attempts } satisfies OutlineFile);
  console.log(`  outline ${variant} ${dilemmaId} ${arm}${leaks.length ? `  LEAK: ${leaks.join(", ")}` : ""}`);
}

const judgePath = (variant: string, sample: number, judge: string, group: ReasoningGroup) =>
  join(sampleDir(variant, sample), "reasoning", `judge__${judge}__${group.id}.json`);

function outlinesFor(variant: string, sample: number, group: ReasoningGroup): Record<string, string> | null {
  const outlines: Record<string, string> = {};
  for (const arm of group.arms) {
    const file = readJson<OutlineFile>(outlinePath(variant, sample, group.dilemmaId, arm));
    if (!file) return null;
    outlines[arm] = file.text;
  }
  return outlines;
}

async function judgeGroup(variant: string, sample: number, judge: (typeof JUDGES)[number], group: ReasoningGroup) {
  const outlines = outlinesFor(variant, sample, group);
  if (!outlines) throw new Error(`missing outlines for ${variant} ${group.id}`);
  const prompt = judgePrompt(DILEMMAS.find((d) => d.id === group.dilemmaId)!, group, outlines);
  const inputHash = sha256(`${judge.label}\n${prompt}`);
  const path = judgePath(variant, sample, judge.label, group);
  const cached = readJson<JudgeFile>(path);
  if (cached?.inputHash === inputHash && parseJudge(cached.raw)) return;
  const raw = await withRetry(`judge ${judge.label} ${variant} ${group.id}`, async () => {
    const reply = await judge.call(prompt);
    if (!parseJudge(reply)) throw new Error(`unparsable judge reply: ${reply.slice(0, 200)}`);
    return reply;
  });
  writeJson(path, { inputHash, model: judge.label, raw } satisfies JudgeFile);
  console.log(`  judge ${judge.label} ${variant} ${group.id}`);
}

// ---------- report ----------

interface Tally { correct: number; total: number; chance: number; takenForBaseline: number; withBaseline: number; groups: number }
const empty = (): Tally => ({ correct: 0, total: 0, chance: 0, takenForBaseline: 0, withBaseline: 0, groups: 0 });

function add(tally: Tally, score: GroupScore) {
  tally.correct += score.correct;
  tally.total += score.size;
  tally.chance += 1; // expected correct under random one-to-one assignment: 1 per group
  tally.takenForBaseline += score.thinkersTakenForBaseline;
  tally.withBaseline += score.thinkersWithBaseline;
  tally.groups += 1;
}

const pct = (a: number, b: number) => (b === 0 ? "-" : `${Math.round((100 * a) / b)}%`);

function renderReport(options: Options): string {
  const lines: string[] = [
    "# Reasoning test: same verdict, different reasoning?",
    "",
    `- Date: ${new Date().toISOString().slice(0, 10)}. Split: development. Sample: ${options.sample}.`,
    `- Groups: answers (7 test thinkers + baseline) on one dilemma that chose the same option; 3 or more per group.`,
    `- Outlines: ${OUTLINER.label} removes names, sources, technical terms and the first-person voice. Judges: ${JUDGES.map((j) => j.label).join(", ")}, each separately.`,
    "- Matched: share of outlines that the judge gave to the right author. Chance: the expected share with random assignment (1 per group).",
    "- Taken for baseline: thinker outlines that the judge gave to the sensible adviser, in groups that include the baseline. A high value means the thinker's reasoning reads like common sense. Its chance column is the rate with random assignment.",
    ""
  ];
  const perArm: Record<string, Record<string, { ok: number; n: number }>> = {};
  lines.push("| variant | judge | groups | outlines | matched | chance | thinkers taken for baseline | chance |", "| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const variant of options.variants) {
    const groups = groupsFor(variant, options.sample);
    for (const judge of JUDGES) {
      const tally = empty();
      let baselineChance = 0;
      for (const group of groups) {
        const file = readJson<JudgeFile>(judgePath(variant, options.sample, judge.label, group));
        const result = file && parseJudge(file.raw);
        if (!result) continue;
        const score = scoreGroup(group, result);
        add(tally, score);
        if (score.thinkersWithBaseline > 0) baselineChance += score.thinkersWithBaseline / group.arms.length;
        for (const [arm, ok] of Object.entries(score.perArm)) {
          const cell = ((perArm[`${variant} / ${judge.label}`] ??= {})[arm] ??= { ok: 0, n: 0 });
          cell.n += 1;
          if (ok) cell.ok += 1;
        }
      }
      lines.push(`| ${variant} | ${judge.label} | ${tally.groups}/${groups.length} | ${tally.total} | ${tally.correct} (${pct(tally.correct, tally.total)}) | ${pct(tally.chance, tally.total)} | ${tally.takenForBaseline}/${tally.withBaseline} (${pct(tally.takenForBaseline, tally.withBaseline)}) | ${pct(baselineChance, tally.withBaseline)} |`);
    }
  }
  lines.push("", "## Matched, by author", "", `| variant / judge | ${ARMS.map(authorName).map((n) => (n.length > 12 ? "baseline" : n)).join(" | ")} |`, `| --- | ${ARMS.map(() => "---").join(" | ")} |`);
  for (const [row, cells] of Object.entries(perArm)) {
    lines.push(`| ${row} | ${ARMS.map((arm) => (cells[arm] ? `${cells[arm].ok}/${cells[arm].n}` : "-")).join(" | ")} |`);
  }
  let leaks = 0;
  let outlines = 0;
  for (const variant of options.variants) {
    for (const group of groupsFor(variant, options.sample)) {
      for (const arm of group.arms) {
        const file = readJson<OutlineFile>(outlinePath(variant, options.sample, group.dilemmaId, arm));
        if (!file) continue;
        outlines += 1;
        if (file.leaks.length) leaks += 1;
      }
    }
  }
  lines.push("", `Outlines with a leaked word after one retry: ${leaks} of ${outlines}.`);
  return lines.join("\n") + "\n";
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const stages = options.stage === "all" ? ["outline", "judge", "report"] : [options.stage];
  if (stages.includes("outline")) {
    const jobs = options.variants.flatMap((variant) =>
      groupsFor(variant, options.sample).flatMap((group) => group.arms.map((arm) => ({ variant, group, arm }))));
    console.log(`Outlines: ${jobs.length}`);
    await pool(jobs, options.concurrency, ({ variant, group, arm }) => makeOutline(variant, options.sample, group.dilemmaId, arm));
  }
  if (stages.includes("judge")) {
    const jobs = options.variants.flatMap((variant) =>
      groupsFor(variant, options.sample).flatMap((group) => JUDGES.map((judge) => ({ variant, group, judge }))));
    console.log(`Judgments: ${jobs.length}`);
    await pool(jobs, options.concurrency, ({ variant, group, judge }) => judgeGroup(variant, options.sample, judge, group));
  }
  if (stages.includes("report")) {
    const file = join(HERE, "data", "reasoning-development.md");
    writeFileSync(file, renderReport(options));
    console.log(`Report saved to ${file}`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
