import { describe, expect, it } from "vitest";
import { VERDICT_DILEMMAS } from "./answerKey";
import {
  authorName, BASELINE_AUTHOR, buildGroups, findLeaks, judgePrompt, LABELS, outlinePrompt, parseJudge, scoreGroup, shuffledArms,
  type Arm, type ReasoningGroup
} from "./reasoning";

const dilemma = VERDICT_DILEMMAS.find((d) => d.id === "hiding-friend")!;
const [first, second] = dilemma.options.map((option) => option.id);

describe("buildGroups", () => {
  it("groups arms by verdict, keeps groups of 3 or more, and skips unknown verdicts", () => {
    const verdicts: Partial<Record<Arm, string>> = {
      baseline: first, "mill-utilitarianism": first, "kant-deontology": second,
      "aristotle-virtue-ethics": first, "confucius-role-ethics": "none", "hume-sentimentalism": second
    };
    const groups = buildGroups([dilemma], (_, arm) => verdicts[arm] ?? null, Object.keys(verdicts) as Arm[]);
    expect(groups).toEqual([
      { id: `hiding-friend__${first}`, dilemmaId: "hiding-friend", verdict: first, arms: ["baseline", "mill-utilitarianism", "aristotle-virtue-ethics"] }
    ]);
  });
});

describe("findLeaks", () => {
  it("finds names, titles and technical terms", () => {
    expect(findLeaks("As Kant says, act only on a maxim you can will")).toEqual(["Kant", "maxim"]);
    expect(findLeaks("The gentleman follows the rites")).toEqual(["gentleman"]);
    expect(findLeaks("I teach that the mean is best")).toEqual(["the mean", "I teach"]);
  });

  it("allows plain-language reasons", () => {
    expect(findLeaks("Conclusion: decline. Reasons: 1. A duty to oneself not to damage one's own body. 2. What the role of a child requires.")).toEqual([]);
    expect(findLeaks("The children were hungry; the general rule gives way.")).toEqual([]);
  });
});

describe("prompts", () => {
  const group: ReasoningGroup = { id: "g1", dilemmaId: dilemma.id, verdict: first, arms: ["baseline", "kant-deontology", "mill-utilitarianism"] };

  it("outline prompt contains the case and the advice", () => {
    const prompt = outlinePrompt(dilemma, "ADVICE TEXT");
    expect(prompt).toContain(dilemma.text);
    expect(prompt).toContain("ADVICE TEXT");
  });

  it("shuffles in a fixed order that does not depend on the input order", () => {
    const reversed = { ...group, arms: [...group.arms].reverse() };
    expect(shuffledArms(group)).toEqual(shuffledArms(reversed));
  });

  it("judge prompt lists every author and every outline, and no author name next to its outline", () => {
    const outlines = Object.fromEntries(group.arms.map((arm) => [arm, `OUTLINE-${arm}`]));
    const prompt = judgePrompt(dilemma, group, outlines);
    for (const arm of group.arms) {
      expect(prompt).toContain(authorName(arm));
      expect(prompt).toContain(`OUTLINE-${arm}`);
    }
    shuffledArms(group).forEach((arm, index) => expect(prompt).toContain(`Outline ${LABELS[index]}:\nOUTLINE-${arm}`));
  });
});

describe("judge parsing and scoring", () => {
  const group: ReasoningGroup = { id: "g2", dilemmaId: dilemma.id, verdict: first, arms: ["baseline", "kant-deontology", "mill-utilitarianism"] };
  const order = shuffledArms(group);

  it("parses JSON inside other text", () => {
    expect(parseJudge('Here: {"assignments": {"A": "Kant"}, "notes": "x"} done')).toEqual({ assignments: { A: "Kant" }, notes: "x" });
    expect(parseJudge("no json")).toBeNull();
  });

  it("scores correct matches and thinkers taken for the baseline", () => {
    const assignments: Record<string, string> = {};
    order.forEach((arm, index) => { assignments[LABELS[index]] = authorName(arm); });
    expect(scoreGroup(group, { assignments, notes: "" })).toMatchObject({ size: 3, correct: 3, thinkersTakenForBaseline: 0, thinkersWithBaseline: 2 });

    // Swap the baseline with Kant: two wrong, and Kant is taken for the baseline.
    const swapped = { ...assignments };
    const baselineLabel = LABELS[order.indexOf("baseline")];
    const kantLabel = LABELS[order.indexOf("kant-deontology")];
    swapped[baselineLabel] = "kant";
    swapped[kantLabel] = BASELINE_AUTHOR.toUpperCase();
    expect(scoreGroup(group, { assignments: swapped, notes: "" })).toMatchObject({ correct: 1, thinkersTakenForBaseline: 1 });
  });
});
