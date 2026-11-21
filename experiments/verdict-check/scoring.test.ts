import { describe, expect, it } from "vitest";
import type { Basis, CasePair } from "./pairs";
import { TEST_PHILOSOPHERS, type ExpectedVerdict, type VerdictDilemma } from "./answerKey";
import { axisCount, baselineComparisons, buildTasks, dilemmaGroup, distinctness, separation, isMatch, pairResult, pairTaskId, sampleAgreement, scorePairs, scoreProfile, scoreVoice, sumDistinctness, type VerdictMap } from "./scoring";

const entry = (option: string, confidence: "clear" | "disputed" = "clear", alsoAccept?: string[]): ExpectedVerdict => ({
  option, confidence, alsoAccept, reason: "r", source: "s"
});

const options = [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }];

const dilemmas: VerdictDilemma[] = [
  {
    id: "d1", title: "D1", split: "development", kind: "split", text: "t", options,
    philosophers: {
      "mill-utilitarianism": entry("a"),
      "kant-deontology": entry("b", "disputed", ["c"]),
      "confucius-role-ethics": entry("b")
    },
    axes: [
      { axis: "outcomesPrinciples", negative: "a", positive: "b" },
      { axis: "impartialPartial", negative: "a", positive: "c" }
    ]
  },
  {
    id: "d2", title: "D2", split: "development", kind: "split", text: "t", options,
    philosophers: { "mill-utilitarianism": entry("a"), "kant-deontology": entry("a") },
    axes: [{ axis: "individualCollective", negative: "a", positive: "b" }]
  },
  {
    id: "d3", title: "D3", split: "development", kind: "agreement", text: "t", options,
    philosophers: {
      "mill-utilitarianism": entry("a"), "kant-deontology": entry("a"),
      "aristotle-virtue-ethics": entry("a"), "confucius-role-ethics": entry("a")
    },
    axes: []
  }
];

const pairOptions = [{ id: "old", label: "Old" }, { id: "new", label: "New" }];
const pairEntry = (expect: "flip" | "same", base: string, variant: string, basis: Basis = "recorded", variantBasis: Basis = basis) => ({
  expect, base, variant, basis: { base: basis, variant: variantBasis }, reason: "r", source: "s"
});
const pairs: CasePair[] = [
  {
    id: "p1", title: "P1", split: "development", pivot: "x", base: "base text", variant: "variant text", options: pairOptions,
    thinkers: {
      "confucius-role-ethics": pairEntry("flip", "new", "old"),
      "kant-deontology": pairEntry("same", "old", "old", "inferred")
    }
  }
];

describe("buildTasks", () => {
  const tasks = buildTasks(dilemmas, pairs);

  it("makes voice tasks for the baseline and every test philosopher on each dilemma", () => {
    const voice = tasks.filter((task) => task.route === "voice");
    expect(voice).toHaveLength(3 * (1 + TEST_PHILOSOPHERS.length));
    expect(voice.map((task) => task.id)).toContain("voice__d1__kant-deontology");
    expect(voice.map((task) => task.id)).toContain("voice__d1__aristotle-virtue-ethics");
    expect(voice.map((task) => task.id)).toContain("voice__d1__baseline");
  });

  it("makes two profile tasks per production axis and skips impartialPartial", () => {
    const profile = tasks.filter((task) => task.route === "profile");
    expect(profile.map((task) => task.id)).toEqual([
      "profile__d1__outcomesPrinciples__neg", "profile__d1__outcomesPrinciples__pos",
      "profile__d2__individualCollective__neg", "profile__d2__individualCollective__pos"
    ]);
    const first = profile[0];
    expect(first.route === "profile" && first.profile).toEqual({ outcomesPrinciples: -0.85, individualCollective: 0, reasonIntuition: 0 });
    const last = profile[3];
    expect(last.route === "profile" && last.profile).toEqual({ outcomesPrinciples: 0, individualCollective: 0.85, reasonIntuition: 0 });
  });

  it("makes a base and a variant task for the baseline and every test philosopher in a pair, carrying the case text", () => {
    const pair = tasks.filter((task) => task.route === "pair");
    expect(pair.map((task) => task.id)).toEqual([
      "pair__p1__baseline__base", "pair__p1__baseline__variant",
      ...TEST_PHILOSOPHERS.flatMap((id) => [`pair__p1__${id}__base`, `pair__p1__${id}__variant`])
    ]);
    expect(pair[0]).toMatchObject({ arm: "baseline", side: "base", text: "base text", pairId: "p1" });
    expect(pair[1]).toMatchObject({ side: "variant", text: "variant text" });
    expect(pair[2]).toMatchObject({ arm: "mill-utilitarianism" });
    expect(pair.some((task) => "philosopherId" in task)).toBe(false);
  });
});

describe("isMatch", () => {
  it("accepts the option and alsoAccept, nothing else", () => {
    const expected = entry("a", "disputed", ["b"]);
    expect(isMatch(expected, "a")).toBe(true);
    expect(isMatch(expected, "b")).toBe(true);
    expect(isMatch(expected, "c")).toBe(false);
    expect(isMatch(expected, "none")).toBe(false);
  });
});

describe("scoreVoice", () => {
  it("reports everything as missing when nothing has run", () => {
    const score = scoreVoice(dilemmas, {});
    expect(score.tasks).toBe(9);
    expect(score.missing).toBe(9);
    expect(score.matchOverall).toEqual({ hit: 0, total: 0 });
    expect(score.agreement).toEqual({ dilemmas: 1, complete: 0, allExpected: 0 });
  });

  it("scores matches, none verdicts and agreement, and counts open entries", () => {
    const verdicts = {
      "voice__d1__mill-utilitarianism": "a",       // match
      "voice__d1__kant-deontology": "c",           // match via alsoAccept (disputed)
      "voice__d1__confucius-role-ethics": "none",  // mismatch
      "voice__d2__mill-utilitarianism": "a",
      "voice__d3__mill-utilitarianism": "a",
      "voice__d3__kant-deontology": "a",
      "voice__d3__aristotle-virtue-ethics": "a",
      "voice__d3__confucius-role-ethics": "b"
    };
    const open: VerdictDilemma = { ...dilemmas[1], id: "d4", philosophers: {}, open: { "kant-deontology": "r", "mill-utilitarianism": "r" }, axes: [] };
    const score = scoreVoice([...dilemmas, { ...open, kind: "split" }], verdicts);
    expect(score.missing).toBe(1);
    expect(score.matchOverall).toEqual({ hit: 6, total: 8 });
    expect(score.matchClear).toEqual({ hit: 5, total: 7 });
    expect(score.matchByPhilosopher["kant-deontology"]).toEqual({ hit: 2, total: 2 });
    expect(score.noneVerdicts).toEqual({ hit: 1, total: 8 });
    expect(score.split).toEqual({ dilemmas: 3, openEntries: 2 });
    expect(score.agreement).toEqual({ dilemmas: 1, complete: 1, allExpected: 0 });
    expect(score.rows.some((row) => row.philosopherId === "aristotle-virtue-ethics" && row.dilemmaId === "d1")).toBe(false);
  });

  it("counts an agreement dilemma where every keyed philosopher got the expected option", () => {
    const verdicts = Object.fromEntries(
      ["mill-utilitarianism", "kant-deontology", "aristotle-virtue-ethics", "confucius-role-ethics"].map((id) => [`voice__d3__${id}`, "a"])
    );
    expect(scoreVoice(dilemmas, verdicts).agreement).toEqual({ dilemmas: 1, complete: 1, allExpected: 1 });
  });
});

describe("scorePairs", () => {
  const flipRow = (base?: string, variant?: string) => {
    const verdicts: Record<string, string | undefined> = {
      "pair__p1__confucius-role-ethics__base": base,
      "pair__p1__confucius-role-ethics__variant": variant
    };
    return scorePairs(pairs, verdicts).rows.find((row) => row.philosopherId === "confucius-role-ethics")!;
  };
  const sameRow = (base?: string, variant?: string) => {
    const verdicts: Record<string, string | undefined> = {
      "pair__p1__kant-deontology__base": base,
      "pair__p1__kant-deontology__variant": variant
    };
    return scorePairs(pairs, verdicts).rows.find((row) => row.philosopherId === "kant-deontology")!;
  };

  it("scores a correct flip", () => {
    expect(flipRow("new", "old")).toMatchObject({ responded: true, correct: true });
    expect(pairResult(flipRow("new", "old"))).toBe("correct");
  });

  it("scores a flip in the wrong direction", () => {
    expect(flipRow("old", "new")).toMatchObject({ responded: true, correct: false });
    expect(pairResult(flipRow("old", "new"))).toBe("wrong direction");
  });

  it("scores no flip", () => {
    expect(flipRow("new", "new")).toMatchObject({ responded: false, correct: false });
    expect(pairResult(flipRow("new", "new"))).toBe("no flip");
  });

  it("labels a none verdict as no choice", () => {
    expect(flipRow("new", "none")).toMatchObject({ responded: false, correct: false });
    expect(sameRow("none", "none")).toMatchObject({ responded: false, correct: false });
    expect(pairResult(flipRow("new", "none"))).toBe("no choice");
    expect(pairResult(sameRow("none", "old"))).toBe("no choice");
    expect(scorePairs(pairs, { "pair__p1__kant-deontology__base": "none", "pair__p1__kant-deontology__variant": "old" }).same).toMatchObject({ changed: 0, heldOtherAnswer: 0 });
  });

  it("leaves a row with a missing verdict undefined", () => {
    expect(flipRow("new", undefined)).toMatchObject({ responded: undefined, correct: undefined });
    expect(pairResult(flipRow("new", undefined))).toBe("missing");
  });

  it("scores a correct same", () => {
    expect(sameRow("old", "old")).toMatchObject({ responded: true, correct: true });
  });

  it("scores held other answer", () => {
    expect(sameRow("new", "new")).toMatchObject({ responded: true, correct: false });
    expect(pairResult(sameRow("new", "new"))).toBe("held other answer");
  });

  it("scores changed", () => {
    expect(sameRow("old", "new")).toMatchObject({ responded: false, correct: false });
    expect(pairResult(sameRow("old", "new"))).toBe("changed");
  });

  const arms = ["baseline", ...TEST_PHILOSOPHERS];
  const fill = (patterns: Record<string, [string?, string?]>) =>
    Object.fromEntries(arms.flatMap((arm) => [[`pair__p1__${arm}__base`, patterns[arm]?.[0]], [`pair__p1__${arm}__variant`, patterns[arm]?.[1]]]));

  it("compares a keyed thinker's pattern with the baseline", () => {
    const row = (baseline: [string?, string?], confucius: [string?, string?]) =>
      scorePairs(pairs, fill({ baseline, "confucius-role-ethics": confucius })).rows.find((r) => r.philosopherId === "confucius-role-ethics")!;
    expect(row(["new", "new"], ["new", "old"])).toMatchObject({ pattern: "new→old", baselinePattern: "new→new", differsFromBaseline: true });
    expect(row(["new", "old"], ["new", "old"])).toMatchObject({ differsFromBaseline: false });
    expect(row(["new", undefined], ["new", "old"]).differsFromBaseline).toBeUndefined();
    expect(row(["new", "old"], ["new", undefined])).toMatchObject({ differsFromBaseline: undefined, pattern: "new→missing" });
  });

  it("reads usesPivotBoth from both sides", () => {
    const verdicts = fill({ "confucius-role-ethics": ["new", "old"] });
    const both = scorePairs(pairs, verdicts, { "pair__p1__confucius-role-ethics__base": true, "pair__p1__confucius-role-ethics__variant": true });
    const one = scorePairs(pairs, verdicts, { "pair__p1__confucius-role-ethics__base": true, "pair__p1__confucius-role-ethics__variant": false });
    expect(both.rows.find((r) => r.philosopherId === "confucius-role-ethics")!.usesPivotBoth).toBe(true);
    expect(both.correctAndUsesPivot).toBe(1);
    expect(one.correctAndUsesPivot).toBe(0);
  });

  it("aggregates complete rows only, and counts correct rows that differ from the baseline", () => {
    const score = scorePairs(pairs, {
      "pair__p1__confucius-role-ethics__base": "old",
      "pair__p1__confucius-role-ethics__variant": "new",
      "pair__p1__kant-deontology__base": "old"
    });
    expect(score.tasks).toBe(4);
    expect(score.missing).toBe(1);
    expect(score.flip).toEqual({ total: 1, complete: 1, correct: 0, wrongDirection: 1, noFlip: 0 });
    expect(score.same).toEqual({ total: 1, complete: 0, correct: 0, heldOtherAnswer: 0, changed: 0 });
    expect(score.byPhilosopher["confucius-role-ethics"]).toEqual({ total: 1, complete: 1, correct: 0 });
    expect(score.byBasis.someInferred).toEqual({ total: 1, complete: 0, correct: 0 });
    expect(score.byBasis.bothRecorded).toEqual({ total: 1, complete: 1, correct: 0 });

    const good = scorePairs(pairs, fill({ baseline: ["new", "new"], "confucius-role-ethics": ["new", "old"], "kant-deontology": ["old", "old"] }));
    expect(good.flip.correct + good.same.correct).toBe(2);
    expect(good.correctAndDifferent).toBe(2);
    expect(good.byExpect).toEqual({ flip: { total: 1, complete: 1, correct: 1 }, same: { total: 1, complete: 1, correct: 1 } });
    const flat = scorePairs(pairs, fill({ baseline: ["new", "new"], "confucius-role-ethics": ["new", "old"], "kant-deontology": ["new", "new"] }));
    expect(flat.correctAndDifferent).toBe(1);
  });

  it("splits by basis: both sides recorded against at least one side inferred", () => {
    const mixed: CasePair[] = [{ ...pairs[0], thinkers: { "kant-deontology": pairEntry("same", "old", "old", "recorded", "inferred"), "confucius-role-ethics": pairEntry("flip", "new", "old") } }];
    const score = scorePairs(mixed, {});
    expect(score.byBasis.bothRecorded.total).toBe(1);
    expect(score.byBasis.someInferred.total).toBe(1);
  });

  it("builds the matrix and counts pairs where every arm has the same pattern", () => {
    const same: [string, string] = ["old", "old"];
    const allSame = scorePairs(pairs, fill(Object.fromEntries(arms.map((arm) => [arm, same]))));
    expect(allSame.allSamePairs).toEqual({ complete: 1, allSame: 1 });
    expect(allSame.matrix[0]).toMatchObject({ pairId: "p1", distinct: 1, allSame: true });
    expect(allSame.matrix[0].patterns.baseline).toBe("old→old");

    const mixed = scorePairs(pairs, fill({ ...Object.fromEntries(arms.map((arm) => [arm, same])), "kant-deontology": ["old", "new"], "mill-utilitarianism": ["old", "new"], "confucius-role-ethics": ["new", "old"] }));
    expect(mixed.matrix[0].distinct).toBe(3);
    expect(mixed.allSamePairs).toEqual({ complete: 1, allSame: 0 });

    const partial = scorePairs(pairs, fill({ baseline: same, "mill-utilitarianism": same }));
    expect(partial.matrix[0]).toMatchObject({ distinct: 1, allSame: false });
    expect(partial.matrix[0].patterns["kant-deontology"]).toBe("incomplete");
    expect(partial.allSamePairs).toEqual({ complete: 0, allSame: 0 });
  });
});

describe("scoreProfile", () => {
  it("handles missing verdicts", () => {
    const score = scoreProfile(dilemmas, { "profile__d1__outcomesPrinciples__neg": "a" });
    expect(score.rows).toHaveLength(2); // impartialPartial is skipped
    expect(score.tasks).toBe(4);
    expect(score.missing).toBe(3);
    expect(score.overall).toEqual({ pairs: 2, complete: 0, bothMatch: 0, differs: 0 });
    expect(score.rows[0].bothMatch).toBeUndefined();
  });

  it("scores bothMatch and differs, and treats none as no difference", () => {
    const score = scoreProfile(dilemmas, {
      "profile__d1__outcomesPrinciples__neg": "a",
      "profile__d1__outcomesPrinciples__pos": "b",
      "profile__d2__individualCollective__neg": "a",
      "profile__d2__individualCollective__pos": "none"
    });
    expect(score.rows[0]).toMatchObject({ bothMatch: true, differs: true });
    expect(score.rows[1]).toMatchObject({ bothMatch: false, differs: false });
    expect(score.overall).toEqual({ pairs: 2, complete: 2, bothMatch: 1, differs: 1 });
    expect(score.byAxis.outcomesPrinciples).toEqual({ pairs: 1, complete: 1, bothMatch: 1, differs: 1 });
    expect(score.byAxis.reasonIntuition).toEqual({ pairs: 0, complete: 0, bothMatch: 0, differs: 0 });
  });
});

describe("axisCount", () => {
  it("counts split dilemmas by axis", () => {
    const count = axisCount(dilemmas);
    expect(count.splitDilemmas).toBe(2);
    expect(count.decides).toMatchObject({ outcomesPrinciples: 1, individualCollective: 1, reasonIntuition: 0, impartialPartial: 1 });
    expect(count.onlyThisAxis).toMatchObject({ outcomesPrinciples: 0, individualCollective: 1, impartialPartial: 0 });
    expect(count.noAxis).toBe(0);
  });

  it("skips dilemmas of kind open", () => {
    expect(axisCount([...dilemmas, { ...dilemmas[0], kind: "open" }]).splitDilemmas).toBe(2);
  });

  it("counts a split dilemma with no axis", () => {
    expect(axisCount([{ ...dilemmas[0], axes: [] }]).noAxis).toBe(1);
  });
});

describe("sampleAgreement", () => {
  it("counts stable, unstable and incomplete tasks across samples", () => {
    const result = sampleAgreement(["t1", "t2", "t3", "t4"], [
      { t1: "a", t2: "a", t3: "a", t4: "none" },
      { t1: "a", t2: "b", t4: "none" },
      { t1: "a", t2: "a", t3: "a", t4: "none" }
    ]);
    expect(result.complete).toBe(3);
    expect(result.stable).toBe(2);
    expect(result.incomplete).toBe(1);
    expect(result.unstable).toEqual([{ taskId: "t2", verdicts: ["a", "b", "a"] }]);
  });

  it("treats one sample as fully stable", () => {
    expect(sampleAgreement(["t1"], [{ t1: "b" }])).toEqual({ complete: 1, stable: 1, unstable: [], incomplete: 0 });
  });
});

describe("distinctness", () => {
  const pair: CasePair = {
    id: "p1", title: "t", split: "development", pivot: "x", base: "b", variant: "v",
    options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
    thinkers: {}
  };
  it("counts sides and patterns that differ from the baseline, and skips none and missing", () => {
    const verdicts: VerdictMap = {
      [pairTaskId("p1", "baseline", "base")]: "a", [pairTaskId("p1", "baseline", "variant")]: "b",
      [pairTaskId("p1", "kant-deontology", "base")]: "a", [pairTaskId("p1", "kant-deontology", "variant")]: "a",
      [pairTaskId("p1", "mill-utilitarianism", "base")]: "a", [pairTaskId("p1", "mill-utilitarianism", "variant")]: "b",
      [pairTaskId("p1", "hume-sentimentalism", "base")]: "none", [pairTaskId("p1", "hume-sentimentalism", "variant")]: "a"
    };
    const scores = distinctness([pair], verdicts, ["kant-deontology", "mill-utilitarianism", "hume-sentimentalism", "aristotle-virtue-ethics"]);
    expect(scores["kant-deontology"]).toEqual({ sides: 2, differentSides: 1, pairs: 1, differentPatterns: 1 });
    expect(scores["mill-utilitarianism"]).toEqual({ sides: 2, differentSides: 0, pairs: 1, differentPatterns: 0 });
    expect(scores["hume-sentimentalism"]).toEqual({ sides: 1, differentSides: 1, pairs: 0, differentPatterns: 0 });
    expect(scores["aristotle-virtue-ethics"]).toEqual({ sides: 0, differentSides: 0, pairs: 0, differentPatterns: 0 });
    expect(sumDistinctness(scores, ["kant-deontology", "mill-utilitarianism"])).toEqual({ sides: 4, differentSides: 1, pairs: 2, differentPatterns: 1 });
  });
});

describe("case groups, baseline comparisons and separation", () => {
  const d = (id: string, kind: VerdictDilemma["kind"], philosophers: VerdictDilemma["philosophers"]): VerdictDilemma => ({
    id, title: id, split: "development", kind, text: "t", options, philosophers, axes: []
  });
  const contested = d("c", "split", { "kant-deontology": entry("a"), "mill-utilitarianism": entry("b"), "aristotle-virtue-ethics": entry("b") });
  const control = d("k", "agreement", { "kant-deontology": entry("a"), "mill-utilitarianism": entry("a") });
  const other = d("o", "split", { "kant-deontology": entry("a") });

  it("groups dilemmas", () => {
    expect([dilemmaGroup(contested), dilemmaGroup(control), dilemmaGroup(other)]).toEqual(["contested", "control", "other"]);
  });

  it("compares each philosopher with the baseline and counts expected disagreements", () => {
    const verdicts: VerdictMap = {
      "voice__c__baseline": "b", "voice__c__kant-deontology": "a", "voice__c__mill-utilitarianism": "b", "voice__c__aristotle-virtue-ethics": "a"
    };
    const records = baselineComparisons([contested], [], verdicts).filter((record) => record.compared);
    expect(records.map((record) => [record.philosopherId, record.differs])).toEqual([
      ["mill-utilitarianism", false], ["kant-deontology", true], ["aristotle-virtue-ethics", true]
    ]);
    // Kant-Mill and Kant-Aristotle are expected to differ; Mill-Aristotle to agree.
    expect(separation([contested], [], verdicts)).toEqual({ expectedDifferent: 2, reproduced: 1, expectedSame: 1, kept: 0 });
  });
});
