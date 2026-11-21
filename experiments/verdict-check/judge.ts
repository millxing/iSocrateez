/** Pure helpers for the judge model: the prompt, and the reply parser. */
import type { VerdictOption } from "./answerKey";

export interface JudgeReply {
  verdict: string;
  conditional: boolean;
  evidence: string;
  /** Pair tasks only. Undefined when the reply has no such key. */
  usesPivot?: boolean;
}

/**
 * The judge sees only the dilemma, the options and the advice. For a pair task it also gets the pivot
 * text, and reports if the advice rests on the pivot fact. Without `pivot` the prompt is unchanged.
 */
export function buildJudgePrompt(dilemma: string, options: VerdictOption[], advice: string, pivot?: string): string {
  const pivotInstruction = pivot === undefined ? [] : [
    "This dilemma is one of two versions of the same case. The two versions differ in one fact, described in the PIVOT section. You see only one version.",
    "Also report \"usesPivot\": true if the advice gives the fact described in the PIVOT section, as this version of the case states it, as a main reason for its recommendation. Report false if the advice only mentions that fact, or if its reasoning rests on other facts. Decide from the reasoning, not from the mention."
  ];
  const replyShape = pivot === undefined
    ? "{\"verdict\": \"<option id or none>\", \"conditional\": true|false, \"evidence\": \"<one short sentence quoted from the advice>\"}"
    : "{\"verdict\": \"<option id or none>\", \"conditional\": true|false, \"usesPivot\": true|false, \"evidence\": \"<one short sentence quoted from the advice>\"}";
  return [
    "You are a judge in an experiment. You read a dilemma, a fixed list of options, and a piece of advice written for the dilemma.",
    "Decide which listed option the advice recommends for the case as the dilemma states it.",
    "Read each option label as a category. Pick the option whose label covers what the advice tells the person to do, also when the advice adds steps (talk to someone first, soften the manner, compensate someone).",
    "If the advice is conditional (\"do X unless Y\"), apply the facts as the dilemma states them, pick the option that results, and set \"conditional\" to true. Example: the advice says \"keep the promise unless he releases you\" and the dilemma says that he will not release you; the verdict is the option to keep the promise.",
    "If the list has two options, and the advice clearly rejects one of them and does not recommend a course outside both labels, pick the other option.",
    "Answer \"none\" only if the advice declines to choose, makes the choice depend on facts that the dilemma does not give, or recommends a course that no label covers.",
    "Do not judge whether the advice is good. Report only what it recommends.",
    ...pivotInstruction,
    "Reply with ONLY a JSON object, with no other text:",
    replyShape,
    "",
    "=== DILEMMA ===",
    dilemma,
    "",
    "=== OPTIONS ===",
    ...options.map((option) => `- ${option.id}: ${option.label}`),
    "",
    "=== ADVICE ===",
    advice,
    ...(pivot === undefined ? [] : ["", "=== PIVOT ===", pivot])
  ].join("\n");
}

/** Lenient parse: strips code fences, takes the first {...}. Returns null if the reply is not usable. */
export function parseJudgeReply(raw: string, optionIds: string[]): JudgeReply | null {
  const text = raw.replace(/```(?:json)?/gi, "");
  const start = text.indexOf("{");
  if (start < 0) return null;
  // Try each closing brace after the first opening one, shortest first.
  for (let end = text.indexOf("}", start); end >= 0; end = text.indexOf("}", end + 1)) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      const verdict = typeof parsed.verdict === "string" ? parsed.verdict.trim() : "";
      if (verdict !== "none" && !optionIds.includes(verdict)) return null;
      return {
        verdict,
        conditional: parsed.conditional === true,
        evidence: typeof parsed.evidence === "string" ? parsed.evidence : "",
        ...(typeof parsed.usesPivot === "boolean" ? { usesPivot: parsed.usesPivot } : {})
      };
    } catch {
      // Keep looking for a later closing brace.
    }
  }
  // The JSON is malformed (usually a stray quote in the evidence). The short fields are still readable.
  const field = (name: string) => text.match(new RegExp(`"${name}"\\s*:\\s*([\\w-]+)`))?.[1];
  const verdict = text.match(/"verdict"\s*:\s*"([\w-]+)"/)?.[1];
  if (!verdict || (verdict !== "none" && !optionIds.includes(verdict))) return null;
  const usesPivot = field("usesPivot");
  return {
    verdict,
    conditional: field("conditional") === "true",
    evidence: "",
    ...(usesPivot === "true" || usesPivot === "false" ? { usesPivot: usesPivot === "true" } : {})
  };
}
