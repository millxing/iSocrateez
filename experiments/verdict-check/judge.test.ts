import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildJudgePrompt, parseJudgeReply } from "./judge";

const ids = ["keep", "break"];

describe("parseJudgeReply", () => {
  it("reads the short fields when a stray quote breaks the JSON", () => {
    const raw = '{"verdict": "keep", "conditional": true, "usesPivot": false, "evidence": "Keep it.""}';
    expect(parseJudgeReply(raw, ["keep", "break"])).toEqual({ verdict: "keep", conditional: true, evidence: "", usesPivot: false });
    expect(parseJudgeReply('{"verdict": "other", "evidence": "x""}', ["keep", "break"])).toBeNull();
  });

  it("parses a plain JSON reply", () => {
    expect(parseJudgeReply('{"verdict":"keep","conditional":false,"evidence":"Keep it."}', ids)).toEqual({
      verdict: "keep", conditional: false, evidence: "Keep it."
    });
  });

  it("strips code fences and surrounding text", () => {
    const raw = 'Here you go:\n```json\n{"verdict": "break", "conditional": true, "evidence": "Unless {x}."}\n```\nDone.';
    expect(parseJudgeReply(raw, ids)).toEqual({ verdict: "break", conditional: true, evidence: "Unless {x}." });
  });

  it("accepts none", () => {
    expect(parseJudgeReply('{"verdict":"none"}', ids)?.verdict).toBe("none");
  });

  it("rejects an unknown verdict, bad JSON and no JSON", () => {
    expect(parseJudgeReply('{"verdict":"maybe"}', ids)).toBeNull();
    expect(parseJudgeReply('{"verdict": keep}', ids)).toBeNull();
    expect(parseJudgeReply("keep", ids)).toBeNull();
    expect(parseJudgeReply('{"conditional":true}', ids)).toBeNull();
  });
});

describe("parseJudgeReply usesPivot", () => {
  it("reads usesPivot when present and leaves it undefined when absent or not a boolean", () => {
    expect(parseJudgeReply('{"verdict":"keep","conditional":false,"usesPivot":true,"evidence":"e"}', ids)?.usesPivot).toBe(true);
    expect(parseJudgeReply('{"verdict":"keep","usesPivot":false}', ids)?.usesPivot).toBe(false);
    expect(parseJudgeReply('{"verdict":"keep"}', ids)?.usesPivot).toBeUndefined();
    expect(parseJudgeReply('{"verdict":"keep","usesPivot":"yes"}', ids)?.usesPivot).toBeUndefined();
  });
});

describe("buildJudgePrompt", () => {
  it("is unchanged without a pivot (cached judgments stay valid)", () => {
    const prompt = buildJudgePrompt("DILEMMA TEXT\nline two", [{ id: "keep", label: "Keep it" }, { id: "break", label: "Break it" }], "ADVICE TEXT\nmore");
    // SHA-256 of the prompt as the function made it before the pivot option was added.
    expect(createHash("sha256").update(prompt).digest("hex")).toBe("ccbbdda62df7ff78ec73d6661741f193e09a7c89eeff768ad341d9566aa3be5a");
    expect(prompt).not.toContain("usesPivot");
  });

  it("adds the pivot instruction, the reply key and the PIVOT section for a pair task", () => {
    const prompt = buildJudgePrompt("D", [{ id: "keep", label: "Keep it" }], "A", "PIVOT TEXT");
    expect(prompt).toContain("You see only one version.");
    expect(prompt).toContain("\"usesPivot\": true|false");
    expect(prompt.endsWith("=== PIVOT ===\nPIVOT TEXT")).toBe(true);
  });

  it("contains the dilemma, the options and the advice", () => {
    const prompt = buildJudgePrompt("DILEMMA TEXT", [{ id: "keep", label: "Keep it" }], "ADVICE TEXT");
    expect(prompt).toContain("DILEMMA TEXT");
    expect(prompt).toContain("- keep: Keep it");
    expect(prompt).toContain("ADVICE TEXT");
  });
});
