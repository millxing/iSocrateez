import { describe, expect, it } from "vitest";
import { CORE_PHILOSOPHERS, TEST_PHILOSOPHERS, VERDICT_DILEMMAS } from "./answerKey";

describe("answer key", () => {
  it("has unique dilemma ids", () => {
    const ids = VERDICT_DILEMMAS.map((dilemma) => dilemma.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const dilemma of VERDICT_DILEMMAS) {
    describe(dilemma.id, () => {
      const ids = dilemma.options.map((option) => option.id);

      it("has at least two options with unique ids", () => {
        expect(dilemma.options.length).toBeGreaterThanOrEqual(2);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it("refers only to existing options", () => {
        for (const entry of Object.values(dilemma.philosophers)) {
          expect(ids).toContain(entry.option);
          for (const other of entry.alsoAccept ?? []) expect(ids).toContain(other);
          // A key entry may not accept every option.
          expect(new Set([entry.option, ...(entry.alsoAccept ?? [])]).size).toBeLessThan(ids.length);
        }
        for (const axis of dilemma.axes) {
          expect(ids).toContain(axis.negative);
          expect(ids).toContain(axis.positive);
        }
      });

      it("has axis entries with two different options and no duplicate axis", () => {
        for (const axis of dilemma.axes) expect(axis.negative).not.toBe(axis.positive);
        const axes = dilemma.axes.map((axis) => axis.axis);
        expect(new Set(axes).size).toBe(axes.length);
      });

      it("gives a reason and a source for every entry", () => {
        for (const entry of Object.values(dilemma.philosophers)) {
          expect(entry.reason.trim()).not.toBe("");
          expect(entry.source.trim()).not.toBe("");
        }
      });

      it("never lists a thinker as both keyed and open, and gives each open reason", () => {
        for (const [id, reason] of Object.entries(dilemma.open ?? {})) {
          expect(dilemma.philosophers).not.toHaveProperty(id);
          expect(typeof reason === "string" && reason.trim() !== "").toBe(true);
        }
      });

      if (dilemma.kind === "open") {
        it("has no key entries and no axes", () => {
          expect(dilemma.philosophers).toEqual({});
          expect(dilemma.axes).toEqual([]);
        });
      } else if (dilemma.kind === "agreement") {
        it("has no axes, an entry for each core philosopher, and one expected option for every entry", () => {
          expect(dilemma.axes).toEqual([]);
          expect(CORE_PHILOSOPHERS.every((id) => dilemma.philosophers[id] !== undefined)).toBe(true);
          const options = TEST_PHILOSOPHERS.map((id) => dilemma.philosophers[id]?.option).filter((option) => option !== undefined);
          expect(new Set(options).size).toBe(1);
        });
      } else {
        it("has at least one philosopher entry or one axis entry", () => {
          expect(Object.keys(dilemma.philosophers).length > 0 || dilemma.axes.length > 0).toBe(true);
        });
      }
    });
  }

  it("has an agreement dilemma in each split", () => {
    for (const split of ["development", "holdout"] as const) {
      expect(VERDICT_DILEMMAS.some((dilemma) => dilemma.split === split && dilemma.kind === "agreement")).toBe(true);
    }
  });
});
