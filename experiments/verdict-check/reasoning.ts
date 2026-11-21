/**
 * Reasoning test: when two thinkers give the same verdict, do they argue differently, or is it one argument
 * in different words? (The professor's complaint: "the same basic idea in tailored language".)
 *
 * 1. Groups: for each development dilemma, the voice answers (7 test thinkers + the baseline) that chose the
 *    same option. Groups of 3 or more. Uses the cached advice of the verdict check; no new advice calls.
 * 2. Outlines: a small model rewrites each answer as a plain argument outline, without names, sources,
 *    technical terms or the first-person voice. A leak check rejects outlines that keep such words.
 * 3. Matching: a judge sees the outlines of one group, in a fixed random order, and the list of authors,
 *    and assigns each outline to one author (each author once).
 * 4. Score: share of outlines matched correctly, against chance (1/n for a group of n).
 *
 * Pure functions are here; the runner is reasoningRun.ts.
 */
import { createHash } from "node:crypto";
import { PHILOSOPHER_NAMES, type TestPhilosopherId, type VerdictDilemma } from "./answerKey";

export type Arm = TestPhilosopherId | "baseline";

export const BASELINE_AUTHOR = "A sensible adviser with no particular philosophy";

export const authorName = (arm: Arm): string => (arm === "baseline" ? BASELINE_AUTHOR : PHILOSOPHER_NAMES[arm]);

export interface ReasoningGroup {
  /** dilemma id + verdict: unique within one variant and sample. */
  id: string;
  dilemmaId: string;
  verdict: string;
  arms: Arm[];
}

/** Groups of arms that chose the same option on the same dilemma. "none" and unknown verdicts are left out. */
export function buildGroups(
  dilemmas: VerdictDilemma[],
  verdicts: (dilemmaId: string, arm: Arm) => string | null,
  arms: readonly Arm[],
  minSize = 3
): ReasoningGroup[] {
  const groups: ReasoningGroup[] = [];
  for (const dilemma of dilemmas) {
    const byVerdict = new Map<string, Arm[]>();
    for (const arm of arms) {
      const verdict = verdicts(dilemma.id, arm);
      if (!verdict || !dilemma.options.some((option) => option.id === verdict)) continue;
      byVerdict.set(verdict, [...(byVerdict.get(verdict) ?? []), arm]);
    }
    for (const [verdict, members] of byVerdict) {
      if (members.length >= minSize) groups.push({ id: `${dilemma.id}__${verdict}`, dilemmaId: dilemma.id, verdict, arms: members });
    }
  }
  return groups;
}

/**
 * Words that name a thinker, a text or a tradition, or that are technical coinages of one thinker.
 * Plain-language content ("a duty to oneself", "what the role requires") is allowed: that is the reasoning
 * we want to compare. Only the surface vocabulary is removed.
 */
export const LEAK_PATTERNS: RegExp[] = [
  /\b(Mill|Bentham|Kant|Kantian|Aristotle|Aristotelian|Confucius|Confucian|Kongzi|Mencius|Mengzi|Hume|Humean|Maimonides|Rambam|Zilu|Zigong|Yan Hui)\b/i,
  /\b(Analects|Groundwork|Metaphysics of Morals|Nicomachean|Utilitarianism|On Liberty|Treatise|Enquiry|Mishneh|Torah|Talmud|Halakh\w*|Bible|biblical|scripture)\b/i,
  /\b(utilitarian\w*|deontolog\w*|categorical imperative|hypothetical imperative|universali[sz]\w*|maxim|maxims|kingdom of ends|good will)\b/i,
  /\b(greatest happiness|principle of utility|higher pleasures?|lower pleasures?)\b/i,
  /\b(eudaimonia|phronesis|practical wisdom|the mean|golden mean|megalopsych\w*|great-souled|magnanim\w*|akrasia)\b/i,
  /\b(junzi|gentleman|petty man|small man|ren|xiao|filial piety|li \(|the rites|ritual propriety|Heaven|tian|the Way|dao|the Master|sage-kings?|four sprouts|sprouts)\b/i,
  /\b(moral sense|impartial spectator|natural virtues?|artificial virtues?)\b/i,
  /\b(mitzvah|mitzvot|commandments?|tzedakah|geneivat|lashon hara|Sages|rabbis?|rabbinic|Jewish|Judaism|God|divine)\b/i,
  /\b(I teach|I taught|I hold|I wrote|in my (work|writings|view)|my students|my disciples)\b/i
];

export function findLeaks(text: string): string[] {
  return LEAK_PATTERNS.flatMap((pattern) => {
    const match = text.match(pattern);
    return match ? [match[0]] : [];
  });
}

export function outlinePrompt(dilemma: VerdictDilemma, advice: string): string {
  return [
    "You rewrite a piece of ethical advice as a plain outline of its argument.",
    "",
    "Rules:",
    "- Keep every reason the advice gives, with its weight. Keep unusual or surprising reasons. Do not add reasons. Do not merge two different reasons into one.",
    "- Remove the surface: no names of people, schools, books, religions or traditions; no quotations or references; no technical terms of any philosophy (say what the term means in a few plain words instead); no first-person voice of the author (\"I teach\", \"in my view\").",
    "- Do not judge the advice. Do not make it more balanced or more modern than it is.",
    "- Use plain English. 120 to 200 words.",
    "",
    "Format, with these four headings:",
    "Conclusion: one sentence.",
    "Reasons: a numbered list, most important first.",
    "Decisive fact: the one fact in the case that settles it, and why.",
    "What would change the answer: one or two sentences.",
    "",
    `The case: ${dilemma.text}`,
    "",
    "The advice:",
    advice
  ].join("\n");
}

/** The same order for every judge and every run: sorted by a hash of the group id and the arm. */
export function shuffledArms(group: ReasoningGroup): Arm[] {
  const key = (arm: Arm) => createHash("sha256").update(`${group.id}|${arm}`).digest("hex");
  return [...group.arms].sort((a, b) => key(a).localeCompare(key(b)));
}

export const LABELS = "ABCDEFGH".split("");

export function judgePrompt(dilemma: VerdictDilemma, group: ReasoningGroup, outlines: Record<string, string>): string {
  const order = shuffledArms(group);
  const optionLabel = dilemma.options.find((option) => option.id === group.verdict)?.label ?? group.verdict;
  const authors = [...group.arms].map(authorName).sort();
  return [
    "Each outline below gives the argument of one adviser on the same case. All of them reach the same conclusion. Names, sources and technical terms were removed, so judge by the reasoning: which considerations count, how much, and what decides the case.",
    "",
    `The case: ${dilemma.text}`,
    `The conclusion they share: ${optionLabel}`,
    "",
    `The authors (each wrote exactly one outline): ${authors.join("; ")}.`,
    `"${BASELINE_AUTHOR}" means the advice of a careful modern adviser who follows no one thinker.`,
    "",
    ...order.flatMap((arm, index) => [`Outline ${LABELS[index]}:`, outlines[arm], ""]),
    "Assign each outline to one author. Use each author exactly once.",
    "Reply with JSON only, in this form:",
    `{"assignments": {${order.map((_, index) => `"${LABELS[index]}": "<author>"`).join(", ")}}, "notes": "<one or two sentences on what told the outlines apart, or that they were hard to tell apart>"}`
  ].join("\n");
}

export interface JudgeResult {
  assignments: Record<string, string>;
  notes: string;
}

export function parseJudge(raw: string): JudgeResult | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<JudgeResult>;
    if (!parsed.assignments || typeof parsed.assignments !== "object") return null;
    return { assignments: parsed.assignments as Record<string, string>, notes: String(parsed.notes ?? "") };
  } catch {
    return null;
  }
}

export interface GroupScore {
  size: number;
  correct: number;
  /** Thinker outlines that the judge gave to the baseline author. Only counted when the baseline is in the group. */
  thinkersTakenForBaseline: number;
  thinkersWithBaseline: number;
  /** Per arm: true when matched correctly. */
  perArm: Partial<Record<Arm, boolean>>;
}

export function scoreGroup(group: ReasoningGroup, result: JudgeResult): GroupScore {
  const order = shuffledArms(group);
  const normal = (name: string) => name.trim().toLowerCase();
  const hasBaseline = group.arms.includes("baseline");
  const perArm: Partial<Record<Arm, boolean>> = {};
  let correct = 0;
  let takenForBaseline = 0;
  order.forEach((arm, index) => {
    const given = normal(result.assignments[LABELS[index]] ?? "");
    const ok = given === normal(authorName(arm));
    perArm[arm] = ok;
    if (ok) correct += 1;
    if (arm !== "baseline" && hasBaseline && given === normal(BASELINE_AUTHOR)) takenForBaseline += 1;
  });
  return {
    size: group.arms.length,
    correct,
    thinkersTakenForBaseline: takenForBaseline,
    thinkersWithBaseline: hasBaseline ? group.arms.length - 1 : 0,
    perArm
  };
}
