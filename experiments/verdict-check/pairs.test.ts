import { describe, expect, it } from "vitest";
import { VERDICT_DILEMMAS } from "./answerKey";
import { CASE_PAIRS } from "./pairs";

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
