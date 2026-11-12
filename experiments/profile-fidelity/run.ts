/**
 * Profile-fidelity experiment.
 * For each case (dilemma + random 3-axis tuple) generate advice by four routes, then ask
 * judge models to estimate the tuple from the advice alone.
 *
 * Usage (from the repo root):  npx vite-node experiments/profile-fidelity/run.ts <caseCount>
 * Model calls use the `claude` and `codex` CLIs in headless mode (subscription, not API keys).
 * Every output is cached in data/, so a rerun continues where the last run stopped.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProfileTuple, RankedProfile } from "../../shared/contracts";
import { describeAxisPosition, formatTuple, rankPhilosophies } from "../../shared/ethics";
import { buildAdvisorPrompt, buildPlannerPrompt, validatePlannerOutput, type PlannerOutput } from "./legacyPrompts";
import { DILEMMAS } from "./dilemmas";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "data");
const SEED = 20261111;
const TOTAL_CASES = 25;
const EXPLANATION_LEVEL = "informed" as const;
const CONCURRENCY = 4;

const HAIKU = "claude-haiku-5-5";
const SONNET = "claude-sonnet-5-5";
const ARMS = {
  a: { planner: HAIKU, advisor: SONNET, label: "Haiku plan + Sonnet advice" },
  b: { planner: SONNET, advisor: HAIKU, label: "Sonnet plan + Haiku advice" },
  c: { planner: SONNET, advisor: SONNET, label: "Sonnet plan + Sonnet advice" },
  d: { planner: null, advisor: SONNET, label: "Sonnet advice, no plan" }
} as const;
type ArmId = keyof typeof ARMS;
const ARM_IDS = Object.keys(ARMS) as ArmId[];

const JUDGES = {
  opus: { cli: "claude", model: "claude-opus-5-5" },
  astra: { cli: "codex", model: "gpt-6-astra" }
} as const;
type JudgeId = keyof typeof JUDGES;
const JUDGE_IDS = Object.keys(JUDGES) as JudgeId[];

const AXES = ["outcomesPrinciples", "individualCollective", "reasonIntuition"] as const;

interface Case {
  id: string;
  dilemmaTitle: string;
  dilemma: string;
  profile: ProfileTuple;
  nearestProfiles: RankedProfile[];
}

// ---------- cases ----------

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same 25 cases on every run; a pilot uses the first N of them. */
function buildCases(): Case[] {
  const random = mulberry32(SEED);
  const pool = [...DILEMMAS];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  // Slider resolution in the app: steps of 0.05 from -1 to 1.
  const axisValue = () => Number((Math.floor(random() * 41) * 0.05 - 1).toFixed(2));
  return pool.slice(0, TOTAL_CASES).map((dilemma, index) => {
    const profile: ProfileTuple = {
      outcomesPrinciples: axisValue(),
      individualCollective: axisValue(),
      reasonIntuition: axisValue()
    };
    return {
      id: `case-${String(index + 1).padStart(2, "0")}`,
      dilemmaTitle: dilemma.title,
      dilemma: dilemma.text,
      profile,
      nearestProfiles: rankPhilosophies(profile).slice(0, 3)
    };
  });
}

function contextFor(testCase: Case) {
  return {
    dilemma: testCase.dilemma,
    explanationLevel: EXPLANATION_LEVEL,
    personaMode: "personalized" as const,
    profile: testCase.profile,
    nearestProfiles: testCase.nearestProfiles
  };
}

// ---------- prompts that the app does not have ----------

/**
 * Route d: one call. It is the app's advisor prompt with the planner's notes replaced by
 * the inputs and the one instruction that only the planner gets in the app.
 */
function buildSingleCallPrompt(testCase: Case): string {
  const [primary] = testCase.nearestProfiles;
  const { profile } = testCase;
  return [
    "You are the advice stage of an ethical reflection app.",
    "Write in a neutral but thoughtful advisory voice aligned to the user’s profile.",
    "Presentation level: Assume some philosophical training. Moderate precision, limited jargon.",
    "Write concise, actionable markdown with these sections:",
    "1. Core advice",
    "2. Why this fits your ethical profile",
    "3. What to watch for",
    "4. A concrete next step in the next 24 hours",
    "Do not end with follow-up offers, suggestions to continue the conversation, or phrases like 'If you want, I can help you...' — end cleanly after the last section.",
    "Before you write, identify the moral tensions in the dilemma. Surface them in the advice; do not collapse them too quickly.",
    "",
    `Original dilemma: ${testCase.dilemma}`,
    `Ethical tuple: ${formatTuple(profile)}`,
    `Outcomes-Principles: ${describeAxisPosition("outcomesPrinciples", profile.outcomesPrinciples)}`,
    `Individual-Collective: ${describeAxisPosition("individualCollective", profile.individualCollective)}`,
    `Reason-Intuition: ${describeAxisPosition("reasonIntuition", profile.reasonIntuition)}`,
    `Nearest philosophy: ${primary.name} via ${primary.representative}`,
    `Nearest philosophy summary: ${primary.summary}`
  ].join("\n");
}

function buildJudgePrompt(dilemma: string, advice: string): string {
  return [
    "You are a judge in an experiment about an ethical advice app.",
    "The app wrote the advice below for one reader. The app knew the reader's ethical profile and tried to make the advice fit it.",
    "The profile has three axes. Each axis is a number from -1 to +1:",
    "- outcomesPrinciples: -1 = judges actions only by their consequences; +1 = judges actions only by duties, rules and principles.",
    "- individualCollective: -1 = personal freedom and individual rights come first; +1 = community and the shared good come first.",
    "- reasonIntuition: -1 = trusts explicit argument and analysis; +1 = trusts moral feeling, intuition and lived wisdom.",
    "A value near 0 means the reader weighs both sides equally. All values from -1 to +1 are equally likely before you read the advice.",
    "",
    "Estimate the profile the advice was written for. Use the content, the priorities, and the style of reasoning.",
    "A section of the advice that explained the fit to the profile has been removed.",
    "Return strict JSON only, with no markdown fences: {\"outcomesPrinciples\": number, \"individualCollective\": number, \"reasonIntuition\": number, \"note\": \"one short sentence\"}",
    "",
    "=== DILEMMA ===",
    dilemma,
    "",
    "=== ADVICE ===",
    advice
  ].join("\n");
}

/** Removes the "Why this fits your ethical profile" section, which states the profile outright. */
export function stripWhySection(markdown: string): { text: string; stripped: boolean } {
  const headingOf = (line: string) =>
    line.match(/^#{1,6}\s+(.+)/)?.[1] ?? line.match(/^(?:\d+[.)]\s*)?\*\*(.+?)\*\*:?\s*$/)?.[1] ?? null;
  const isWhy = (title: string) => /why\s+this\s+(fits|advice)|ethical\s+profile/i.test(title);
  const kept: string[] = [];
  let skipping = false;
  let stripped = false;
  for (const line of markdown.split("\n")) {
    const title = headingOf(line);
    if (title !== null) {
      skipping = isWhy(title);
      stripped ||= skipping;
    }
    if (!skipping) kept.push(line);
  }
  return { text: kept.join("\n").trim(), stripped };
}

// ---------- model calls ----------

const WORKDIR = mkdtempSync(join(tmpdir(), "isocrateez-exp-"));

function runProcess(command: string, args: string[], stdin: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    // Force subscription sign-in: no API keys.
    delete env.ANTHROPIC_API_KEY;
    delete env.OPENAI_API_KEY;
    const child = spawn(command, args, { cwd: WORKDIR, env, stdio: ["pipe", "pipe", "pipe"] });
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

/** One user message, no tools, no settings, medium effort: as near to the app's API call as the CLI allows. */
async function callClaude(model: string, prompt: string): Promise<string> {
  const { code, stdout, stderr } = await runProcess("claude", [
    "-p", "--model", model, "--effort", "medium",
    "--system-prompt", "", "--tools", "", "--setting-sources", "",
    "--strict-mcp-config", "--disable-slash-commands", "--no-session-persistence",
    "--output-format", "json"
  ], prompt);
  if (code !== 0) throw new Error(`claude exited ${code}: ${(stderr || stdout).slice(0, 400)}`);
  const parsed = JSON.parse(stdout) as { result?: string; is_error?: boolean };
  if (parsed.is_error || !parsed.result) throw new Error(`claude returned an error: ${stdout.slice(0, 400)}`);
  return parsed.result;
}

let codexCounter = 0;
async function callCodex(model: string, prompt: string): Promise<string> {
  const outFile = join(WORKDIR, `codex-${process.pid}-${(codexCounter += 1)}.txt`);
  const { code, stderr } = await runProcess("codex", [
    "exec", "-m", model, "--skip-git-repo-check", "--ephemeral", "-s", "read-only", "-o", outFile
  ], prompt);
  if (code !== 0 || !existsSync(outFile)) throw new Error(`codex exited ${code}: ${stderr.slice(-400)}`);
  return readFileSync(outFile, "utf8");
}

async function withRetry<T>(label: string, action: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      console.error(`  ! ${label} attempt ${attempt} failed: ${String(error).slice(0, 200)}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 15000));
    }
  }
  throw lastError;
}

/** Runs the action once and stores the text; later runs read the stored text. */
async function cached(file: string, action: () => Promise<string>): Promise<string> {
  const path = join(DATA, file);
  if (existsSync(path)) return readFileSync(path, "utf8");
  const started = Date.now();
  const text = await withRetry(file, action);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  console.log(`  ${file}  (${((Date.now() - started) / 1000).toFixed(0)} s)`);
  return text;
}

async function pool<T>(items: T[], worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await worker(item);
  }));
}

// ---------- parsing ----------

function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  return start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
}

/**
 * `strict` is what the app does: a failure there makes the app drop the plan and use its
 * fallback prompt. The experiment repairs the plan instead, so that every route is tested,
 * and records that the app would have fallen back.
 */
function parsePlan(raw: string): { plan: PlannerOutput; strict: boolean } {
  try {
    return { plan: validatePlannerOutput(raw), strict: true };
  } catch {
    const loose = JSON.parse(extractJson(raw)) as Record<string, unknown>;
    const text = (value: unknown) => (Array.isArray(value) ? value.map(String).join(" ") : String(value ?? ""));
    const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : value ? [String(value)] : []);
    return {
      strict: false,
      plan: {
        dilemmaSummary: text(loose.dilemmaSummary),
        keyTensions: list(loose.keyTensions),
        profileInterpretation: text(loose.profileInterpretation),
        framingNotes: list(loose.framingNotes),
        advisorBrief: text(loose.advisorBrief),
        cautionPoints: list(loose.cautionPoints)
      }
    };
  }
}

function parseJudgment(raw: string): ProfileTuple & { note: string } {
  const parsed = JSON.parse(extractJson(raw)) as Record<string, unknown>;
  for (const axis of AXES) {
    const value = parsed[axis];
    if (typeof value !== "number" || !Number.isFinite(value) || value < -1 || value > 1) {
      throw new Error(`Judge value out of range for ${axis}: ${String(value)}`);
    }
  }
  return { ...(parsed as unknown as ProfileTuple), note: String(parsed.note ?? "") };
}

// ---------- stages ----------

async function main() {
  const caseCount = Number(process.argv[2] || 5);
  const cases = buildCases().slice(0, caseCount);
  mkdirSync(DATA, { recursive: true });
  writeFileSync(join(DATA, "cases.json"), JSON.stringify(buildCases(), null, 2));
  console.log(`Cases: ${cases.length}. Work folder for model calls: ${WORKDIR}`);

  console.log("Stage 1: plans");
  const plans = new Map<string, { plan: PlannerOutput; strict: boolean }>();
  await pool(cases.flatMap((testCase) => [HAIKU, SONNET].map((model) => ({ testCase, model }))), async ({ testCase, model }) => {
    const key = `${testCase.id}-${model}`;
    const raw = await cached(`plans/${key}.txt`, () => callClaude(model, buildPlannerPrompt(contextFor(testCase))));
    plans.set(key, parsePlan(raw));
  });

  console.log("Stage 2: advice");
  const advice = new Map<string, string>();
  await pool(cases.flatMap((testCase) => ARM_IDS.map((arm) => ({ testCase, arm }))), async ({ testCase, arm }) => {
    const { planner, advisor } = ARMS[arm];
    const prompt = planner
      ? buildAdvisorPrompt(contextFor(testCase), plans.get(`${testCase.id}-${planner}`)!.plan)
      : buildSingleCallPrompt(testCase);
    advice.set(`${testCase.id}-${arm}`, await cached(`advice/${testCase.id}-${arm}.md`, () => callClaude(advisor, prompt)));
  });

  console.log("Stage 3: judges");
  const rows: Record<string, unknown>[] = [];
  const jobs = cases.flatMap((testCase) => ARM_IDS.flatMap((arm) => JUDGE_IDS.map((judge) => ({ testCase, arm, judge }))));
  await pool(jobs, async ({ testCase, arm, judge }) => {
    const text = advice.get(`${testCase.id}-${arm}`)!;
    const shown = stripWhySection(text);
    const prompt = buildJudgePrompt(testCase.dilemma, shown.text);
    const { cli, model } = JUDGES[judge];
    const file = `judgments/${testCase.id}-${arm}-${judge}.txt`;
    let guess: ReturnType<typeof parseJudgment>;
    try {
      guess = parseJudgment(await cached(file, () => (cli === "claude" ? callClaude(model, prompt) : callCodex(model, prompt))));
    } catch (error) {
      console.error(`  ! ${file}: ${String(error)}`);
      return;
    }
    const planner = ARMS[arm].planner;
    rows.push({
      caseId: testCase.id, dilemma: testCase.dilemmaTitle, arm, armLabel: ARMS[arm].label, judge,
      ...Object.fromEntries(AXES.flatMap((axis) => [[`true_${axis}`, testCase.profile[axis]], [`guess_${axis}`, guess[axis]]])),
      nearestPhilosophy: testCase.nearestProfiles[0].name,
      adviceWords: text.split(/\s+/).filter(Boolean).length,
      whySectionRemoved: shown.stripped,
      plannerStrictJson: planner ? plans.get(`${testCase.id}-${planner}`)!.strict : null,
      judgeNote: guess.note
    });
  });

  rows.sort((left, right) => `${left.caseId}${left.arm}${left.judge}`.localeCompare(`${right.caseId}${right.arm}${right.judge}`));
  writeFileSync(join(DATA, "results.jsonl"), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
  report(rows, cases.length);
}

// ---------- report ----------

function pearson(xs: number[], ys: number[]): number {
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  xs.forEach((x, index) => {
    sxy += (x - mx) * (ys[index] - my);
    sxx += (x - mx) ** 2;
    syy += (ys[index] - my) ** 2;
  });
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
}

function report(rows: Record<string, unknown>[], caseCount: number) {
  const num = (row: Record<string, unknown>, key: string) => row[key] as number;
  const fmt = (value: number) => (Number.isNaN(value) ? "  n/a" : value.toFixed(2).padStart(5));
  const lines: string[] = [`Cases: ${caseCount}. Judgments: ${rows.length} of ${caseCount * ARM_IDS.length * JUDGE_IDS.length}.`, ""];

  const table = (title: string, subset: (row: Record<string, unknown>) => boolean) => {
    lines.push(title, "route  mean abs error (OP / IC / RI / all)    correlation (OP / IC / RI / mean)   exaggeration  words");
    for (const arm of ARM_IDS) {
      const armRows = rows.filter((row) => row.arm === arm && subset(row));
      if (armRows.length === 0) continue;
      const mae = AXES.map((axis) => armRows.reduce((sum, row) => sum + Math.abs(num(row, `guess_${axis}`) - num(row, `true_${axis}`)), 0) / armRows.length);
      const corr = AXES.map((axis) => pearson(armRows.map((row) => num(row, `true_${axis}`)), armRows.map((row) => num(row, `guess_${axis}`))));
      // Above 1: the judges read a more extreme profile than the true one.
      const trueSize = armRows.reduce((sum, row) => sum + AXES.reduce((inner, axis) => inner + Math.abs(num(row, `true_${axis}`)), 0), 0);
      const guessSize = armRows.reduce((sum, row) => sum + AXES.reduce((inner, axis) => inner + Math.abs(num(row, `guess_${axis}`)), 0), 0);
      const words = armRows.reduce((sum, row) => sum + num(row, "adviceWords"), 0) / armRows.length;
      lines.push(
        `  ${arm}    ${mae.map(fmt).join(" /")} /${fmt(mae.reduce((s, v) => s + v, 0) / 3)}        ` +
        `${corr.map(fmt).join(" /")} /${fmt(corr.reduce((s, v) => s + v, 0) / 3)}        ${fmt(guessSize / trueSize)}   ${words.toFixed(0)}`
      );
    }
    lines.push("");
  };

  table("Both judges", () => true);
  for (const judge of JUDGE_IDS) table(`Judge: ${judge}`, (row) => row.judge === judge);

  const notStripped = rows.filter((row) => row.whySectionRemoved === false).length / JUDGE_IDS.length;
  const lenient = new Set(rows.filter((row) => row.plannerStrictJson === false).map((row) => `${row.caseId}${row.arm}`)).size;
  lines.push(`Advice texts where the "why this fits" section was not found: ${notStripped}`);
  lines.push(`Advice texts whose plan was not strict JSON (the app would use its fallback prompt): ${lenient}`);
  lines.push("", ...ARM_IDS.map((arm) => `${arm} = ${ARMS[arm].label}`));
  const text = lines.join("\n");
  writeFileSync(join(DATA, "report.txt"), text + "\n");
  console.log("\n" + text);
}

main().catch((error) => { console.error(error); process.exit(1); });
