import { describe, expect, it } from "vitest";
import type { AnswerRecord } from "./contracts";
import { extendQuestions, isValidAnswerSet, isValidProfileTuple, rankPhilosophies, randomizeQuestions, scoreProfile } from "./ethics";
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

  it("extends a questionnaire by one unused question for each axis until the bank is used up", () => {
    let questions = randomizeQuestions(questionBank, () => 0.1);
    const extended = extendQuestions(questions, questionBank, () => 0.1);

    expect(extended.slice(0, 9)).toEqual(questions);
    expect(extended).toHaveLength(12);
    expect(new Set(extended.map((question) => question.id)).size).toBe(12);
    expect(new Set(extended.slice(9).map((question) => question.axis)).size).toBe(3);

    for (let round = 0; round < 10; round += 1) questions = extendQuestions(questions);
    expect(questions).toHaveLength(questionBank.length);
    expect(new Set(questions.map((question) => question.id)).size).toBe(questionBank.length);
  });

  it("accepts only answer sets that can be scored", () => {
    const ids = ["op-1", "op-2", "op-3", "ic-1", "ic-2", "ic-3", "ri-1", "ri-2", "ri-3"];
    const answers = ids.map((questionId) => ({ questionId, value: 1 }));

    expect(isValidAnswerSet(answers)).toBe(true);
    expect(isValidAnswerSet([...answers, { questionId: "op-4", value: -2 }])).toBe(true);
    expect(isValidAnswerSet(questionBank.map((question) => ({ questionId: question.id, value: 0 })))).toBe(true);

    expect(isValidAnswerSet(answers.slice(1))).toBe(false); // two answers on one axis
    expect(isValidAnswerSet([...answers, answers[0]])).toBe(false); // duplicate question
    expect(isValidAnswerSet([...answers, { questionId: "nope", value: 0 }])).toBe(false);
    expect(isValidAnswerSet([...answers.slice(1), { questionId: "op-1", value: 3 }])).toBe(false);
    expect(isValidAnswerSet([...answers.slice(1), { questionId: "op-1", value: 0.5 }])).toBe(false);
    expect(isValidAnswerSet([...answers.slice(1), null])).toBe(false);
    expect(isValidAnswerSet("answers")).toBe(false);
  });

  it("accepts only profile tuples inside the normalized range", () => {
    expect(isValidProfileTuple({ outcomesPrinciples: -1, individualCollective: 0, reasonIntuition: 1 })).toBe(true);
    expect(isValidProfileTuple({ outcomesPrinciples: -1.1, individualCollective: 0, reasonIntuition: 1 })).toBe(false);
    expect(isValidProfileTuple({ outcomesPrinciples: 0, individualCollective: 0 })).toBe(false);
    expect(isValidProfileTuple(null)).toBe(false);
  });
});
