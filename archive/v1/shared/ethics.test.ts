import { describe, expect, it } from "vitest";
import type { AnswerRecord } from "./contracts";
import { rankPhilosophies, randomizeQuestions, scoreProfile } from "./ethics";
import { questionBank } from "./questionBank";

describe("ethical domain helpers", () => {
  it("selects exactly three unique questions per axis", () => {
    const questions = randomizeQuestions(questionBank, () => 0.1);
    const counts = questions.reduce<Record<string, number>>((accumulator, question) => {
      accumulator[question.axis] = (accumulator[question.axis] || 0) + 1;
      return accumulator;
    }, {});

    expect(questions).toHaveLength(9);
    expect(new Set(questions.map((question) => question.id)).size).toBe(9);
    expect(counts.outcomesPrinciples).toBe(3);
    expect(counts.individualCollective).toBe(3);
    expect(counts.reasonIntuition).toBe(3);
  });

  it("scores and normalizes profile values including reverse polarity questions", () => {
    const answers: AnswerRecord[] = [
      { questionId: "op-1", value: -2 },
      { questionId: "op-6", value: 2 },
      { questionId: "op-8", value: 1 },
      { questionId: "ic-1", value: 2 },
      { questionId: "ic-5", value: -2 },
      { questionId: "ic-10", value: -1 },
      { questionId: "ri-1", value: -2 },
      { questionId: "ri-7", value: 2 },
      { questionId: "ri-10", value: 2 }
    ];

    expect(scoreProfile(answers, questionBank)).toEqual({
      outcomesPrinciples: -0.833,
      individualCollective: 0.833,
      reasonIntuition: -1
    });
  });

  it("ranks the nearest philosophies consistently", () => {
    const ranked = rankPhilosophies({
      outcomesPrinciples: -0.9,
      individualCollective: 0.3,
      reasonIntuition: -0.35
    });

    expect(ranked[0].name).toBe("Utilitarianism");
    expect(ranked[1].distance).toBeGreaterThanOrEqual(ranked[0].distance);
  });
});
