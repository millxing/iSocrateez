import { describe, expect, it } from "vitest";
import { philosophyProfiles } from "./philosophyProfiles";
import { PHILOSOPHER_SCORES, describeFoundation, describeScoreAxis } from "./philosopherScores";

describe("philosopher scores", () => {
  it("has scores from 0 to 10 for every thinker in the app", () => {
    for (const profile of philosophyProfiles) {
      const scores = PHILOSOPHER_SCORES[profile.id];
      expect(scores, profile.id).toBeDefined();
      for (const value of Object.values(scores)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(10);
      }
    }
    expect(Object.keys(PHILOSOPHER_SCORES).sort()).toEqual(philosophyProfiles.map((p) => p.id).sort());
  });

  it("describes scores in plain words", () => {
    expect(describeFoundation(10)).toBe("Central");
    expect(describeFoundation(0)).toBe("Little or none");
    expect(describeScoreAxis(5, "Reason", "Intuition")).toBe("Balanced");
    expect(describeScoreAxis(9, "Reason", "Intuition")).toBe("Strongly toward intuition");
    expect(describeScoreAxis(3, "Reason", "Intuition")).toBe("Moderately toward reason");
  });
});
