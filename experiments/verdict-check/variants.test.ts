import { describe, expect, it } from "vitest";
import type { ProfileTuple } from "../../shared/contracts";
import { getPhilosophyById, philosophyProfiles } from "../../shared/philosophyProfiles";
import { TEST_PHILOSOPHERS } from "./answerKey";
import { LENS_NOTES } from "./lensNotes";
import { HOLDOUT_PASSAGES } from "./pairs";
import { VARIANTS } from "./variants";

describe("baseline prompts", () => {
  it("legacy: differs from the voice prompt only by the persona lines", () => {
    for (const id of TEST_PHILOSOPHERS) {
      const voice = getPhilosophyById(id)!;
      const withVoice = VARIANTS.legacy.voice({ dilemma: "X", voice }).split("\n");
      const baseline = VARIANTS.legacy.baseline({ dilemma: "X" }).split("\n");
      const persona = withVoice.filter((line) => line.startsWith("Perspective: ") || line.startsWith("Voice brief: ") || line === withVoice[1]);
      expect(persona).toHaveLength(3);
      expect(baseline.filter((line) => !withVoice.includes(line))).toEqual(["Write in a neutral, thoughtful advisory voice."]);
    }
  });

  it("prod: has the same rules, sections and dilemma line as the voice prompt, and no philosopher", () => {
    const voice = getPhilosophyById("kant-deontology")!;
    const withVoice = VARIANTS.prod.voice({ dilemma: "X", voice }).split("\n");
    const baseline = VARIANTS.prod.baseline({ dilemma: "X" });
    const shared = withVoice.filter((line) => /^(Rules:|- Answer|- Do not balance|\d\. (Core|What)|\d\. A concrete|In "Core advice"|Original dilemma)/.test(line));
    expect(shared.length).toBeGreaterThanOrEqual(8);
    for (const line of shared) expect(baseline).toContain(line);
    expect(baseline).not.toMatch(/Kant|Perspective:|Voice brief:|this thinker/);
  });
});

describe("holdout protection", () => {
  // If this fails, a prompt (or a note on a philosopher) gives the model a passage that a holdout pair tests.
  // Remove the passage from the prompt. Do not change the pattern to make the test pass. See HOLDOUT_PASSAGES in pairs.ts.
  const leaks = (text: string) =>
    HOLDOUT_PASSAGES.flatMap((entry) => entry.patterns.filter((pattern) => pattern.test(text)).map((pattern) => `${entry.pairId} ${pattern}`));
  const tuples: ProfileTuple[] = [-0.85, 0, 0.85].flatMap((a) =>
    [-0.85, 0.85].map((b) => ({ outcomesPrinciples: a, individualCollective: b, reasonIntuition: -a }))
  );

  for (const [name, variant] of Object.entries(VARIANTS)) {
    it(`${name}: no prompt contains a holdout passage`, () => {
      const prompts = [
        variant.baseline({ dilemma: "X" }),
        ...philosophyProfiles.map((voice) => variant.voice({ dilemma: "X", voice })),
        ...tuples.map((profile) => variant.profile({ dilemma: "X", profile }))
      ];
      expect(prompts.flatMap(leaks)).toEqual([]);
    });
  }
});

describe("notes variant", () => {
  it("is the prod voice prompt plus the two note lines, for each test philosopher", () => {
    for (const id of TEST_PHILOSOPHERS) {
      const voice = getPhilosophyById(id)!;
      const prod = VARIANTS.prod.voice({ dilemma: "X", voice }).split("\n");
      const notes = VARIANTS.notes.voice({ dilemma: "X", voice }).split("\n");
      const added = notes.filter((line) => !prod.includes(line));
      expect(added[0]).toMatch(/^Notes on this thinker/);
      expect(added.join("\n")).toContain(LENS_NOTES[id]);
      expect(notes.filter((line) => !added.includes(line))).toEqual(prod);
    }
  });

  it("has a note of 150 to 350 words for each test philosopher", () => {
    for (const id of TEST_PHILOSOPHERS) {
      const words = LENS_NOTES[id].split(/\s+/).filter(Boolean).length;
      expect(words, id).toBeGreaterThanOrEqual(150);
      expect(words, id).toBeLessThanOrEqual(350);
    }
  });
});
