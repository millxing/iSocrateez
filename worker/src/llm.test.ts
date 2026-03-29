import { describe, expect, it, vi } from "vitest";
import type { AdviceRequest } from "../../shared/contracts";
import { generateAdvice, validatePlannerOutput, type WorkerEnv } from "./llm";

const baseRequest: AdviceRequest = {
  token: "token",
  dilemma: "My friend wants me to hide a serious mistake that could hurt our team if it goes uncorrected.",
  explanationLevel: "general",
  personaMode: "personalized",
  answers: [
    { questionId: "op-1", value: -2 },
    { questionId: "op-2", value: -1 },
    { questionId: "op-3", value: -1 },
    { questionId: "ic-1", value: 1 },
    { questionId: "ic-2", value: 1 },
    { questionId: "ic-3", value: 1 },
    { questionId: "ri-1", value: -1 },
    { questionId: "ri-3", value: -2 },
    { questionId: "ri-6", value: -1 }
  ]
};

const env: WorkerEnv = {
  APP_SHARED_PASSWORD: "secret",
  JWT_SECRET: "jwt",
  PLANNER_PROVIDER: "openai",
  PLANNER_MODEL: "planner-model",
  ADVISOR_PROVIDER: "openai",
  ADVISOR_MODEL: "advisor-model",
  OPENAI_API_KEY: "openai-key"
};

describe("validatePlannerOutput", () => {
  it("throws when the planner result is malformed", () => {
    expect(() => validatePlannerOutput("{\"dilemmaSummary\":true}")).toThrow();
  });
});

describe("generateAdvice", () => {
  it("falls back to a single-stage advisor prompt when planner output is invalid", async () => {
    const invoker = vi
      .fn()
      .mockResolvedValueOnce("not-json")
      .mockResolvedValueOnce("## Core advice\n\nFallback answer");

    const response = await generateAdvice(baseRequest, env, invoker);

    expect(response.modelsUsed).toEqual(["fallback:openai:advisor-model"]);
    expect(response.adviceMarkdown).toContain("Fallback answer");
  });

  it("short-circuits dangerous requests with local safety handling", async () => {
    const invoker = vi.fn();
    const response = await generateAdvice(
      {
        ...baseRequest,
        dilemma: "Should I poison someone who is getting in my way?"
      },
      env,
      invoker
    );

    expect(response.safetyMode).toBe("supportive_refusal");
    expect(invoker).not.toHaveBeenCalled();
  });

  it("allows policy dilemmas about self-harm detection to reach the model pipeline", async () => {
    const invoker = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          dilemmaSummary: "The user is weighing consent against intervention.",
          keyTensions: ["privacy", "duty of care"],
          profileInterpretation: "Outcome-aware but still attentive to legitimacy.",
          framingNotes: ["Treat consent as central."],
          advisorBrief: "Recommend a consent-forward rollout.",
          cautionPoints: ["Do not overclaim model certainty."]
        })
      )
      .mockResolvedValueOnce("## Core advice\n\nDo not ship the escalation flow without explicit consent.");

    const response = await generateAdvice(
      {
        ...baseRequest,
        dilemma:
          "I am a product manager at a health tech startup deciding whether users at risk of self-harm should trigger emergency contact alerts."
      },
      env,
      invoker
    );

    expect(response.safetyMode).toBe("standard");
    expect(invoker).toHaveBeenCalledTimes(2);
  });
});
