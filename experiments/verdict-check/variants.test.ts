import { describe, expect, it } from "vitest";
import { getPhilosophyById } from "../../shared/philosophyProfiles";
import { TEST_PHILOSOPHERS } from "./answerKey";
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
