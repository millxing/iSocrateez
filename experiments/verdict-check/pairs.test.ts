import { describe, expect, it } from "vitest";
import { VERDICT_DILEMMAS } from "./answerKey";
import { CASE_PAIRS, HOLDOUT_PASSAGES } from "./pairs";

describe("case pairs", () => {
  it("have unique ids that differ from every dilemma id", () => {
    const ids = CASE_PAIRS.map((pair) => pair.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const dilemma of VERDICT_DILEMMAS) expect(ids).not.toContain(dilemma.id);
  });

  it("has at least one pair in each split", () => {
    for (const split of ["development", "holdout"] as const) {
      expect(CASE_PAIRS.some((pair) => pair.split === split)).toBe(true);
    }
  });

  it("lists the passage behind every holdout pair, and each pattern finds that passage in the key", () => {
    const holdout = CASE_PAIRS.filter((pair) => pair.split === "holdout");
    expect(HOLDOUT_PASSAGES.map((entry) => entry.pairId).sort()).toEqual(holdout.map((pair) => pair.id).sort());
    for (const entry of HOLDOUT_PASSAGES) {
      const pair = holdout.find((candidate) => candidate.id === entry.pairId)!;
      const keyText = [pair.title, pair.base, pair.variant, ...Object.values(pair.thinkers).flatMap((thinker) => [thinker.reason, thinker.source])].join("\n");
      // A pattern that matches nothing in its own pair's key is probably mistyped.
      expect(entry.patterns.some((pattern) => pattern.test(keyText)), entry.pairId).toBe(true);
    }
  });

  it("does not block passages that development cases use", () => {
    const allowed = ["Analects 13.18: the son bore witness against his father for the theft of a sheep; the upright cover for each other.", "Analects 9.3: the silk cap is thrift.", "Nicomachean Ethics VI.11; II.6"];
    for (const text of allowed) for (const entry of HOLDOUT_PASSAGES) for (const pattern of entry.patterns) expect(pattern.test(text), `${entry.pairId} ${pattern}`).toBe(false);
  });

  for (const pair of CASE_PAIRS) {
    describe(pair.id, () => {
      const ids = pair.options.map((option) => option.id);

      it("has exactly two options with unique ids", () => {
        expect(pair.options).toHaveLength(2);
        expect(new Set(ids).size).toBe(2);
      });

      it("has two different non-empty texts and a pivot", () => {
        expect(pair.base.trim()).not.toBe("");
        expect(pair.variant.trim()).not.toBe("");
        expect(pair.base).not.toBe(pair.variant);
        expect(pair.pivot.trim()).not.toBe("");
      });

      it("has at least one thinker", () => {
        expect(Object.values(pair.thinkers).length).toBeGreaterThanOrEqual(1);
      });

      for (const [thinker, entry] of Object.entries(pair.thinkers)) {
        it(`has a consistent expectation for ${thinker}`, () => {
          expect(ids).toContain(entry.base);
          expect(ids).toContain(entry.variant);
          if (entry.expect === "flip") expect(entry.base).not.toBe(entry.variant);
          else expect(entry.base).toBe(entry.variant);
          expect(["recorded", "inferred"]).toContain(entry.basis.base);
          expect(["recorded", "inferred"]).toContain(entry.basis.variant);
          expect(entry.reason.trim()).not.toBe("");
          expect(entry.source.trim()).not.toBe("");
        });
      }
    });
  }
});
