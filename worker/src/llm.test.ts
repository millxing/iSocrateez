import { describe, expect, it, vi } from "vitest";
import type { AdviceRequest } from "../../shared/contracts";
import { generateAdvice, type WorkerEnv } from "./llm";

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
  ADVISOR_PROVIDER: "openai",
  ADVISOR_MODEL: "advisor-model",
  OPENAI_API_KEY: "openai-key"
};

describe("generateAdvice", () => {
  it("writes the advice with one model call that carries the profile in plain language", async () => {
    const invoker = vi.fn().mockResolvedValueOnce("## Core advice\n\nTell the truth.");

    const response = await generateAdvice(baseRequest, env, invoker);

    expect(invoker).toHaveBeenCalledTimes(1);
    expect(response.adviceMarkdown).toContain("Tell the truth.");
    expect(response.modelsUsed).toEqual(["openai:advisor-model"]);
    expect(response.profile).toEqual({ outcomesPrinciples: -0.667, individualCollective: 0.5, reasonIntuition: -0.667 });
    const prompt = invoker.mock.calls[0][1] as string;
    expect(prompt).toContain(baseRequest.dilemma);
    expect(prompt).toContain("Ethical tuple: (-0.67, 0.50, -0.67)");
    expect(prompt).toContain("Outcomes-Principles: Strongly toward outcomes");
    expect(prompt).toContain("Individual-Collective: Moderately toward collective");
    expect(prompt).toContain("Reason-Intuition: Strongly toward reason");
    expect(prompt).toContain("identify the moral tensions");
  });

  it("uses the model the request selects", async () => {
    const invoker = vi.fn().mockResolvedValueOnce("## Core advice\n\nOk");

    const response = await generateAdvice(
      { ...baseRequest, advisorModel: "openai:gpt-5.4-mini" },
      env,
      invoker
    );

    expect(invoker.mock.calls[0][0]).toMatchObject({ provider: "openai", model: "gpt-5.4-mini" });
    expect(response.modelsUsed).toEqual(["openai:gpt-5.4-mini"]);
  });

  it("lets a provider failure reach the caller", async () => {
    const invoker = vi.fn().mockRejectedValueOnce(new Error("provider down"));

    await expect(generateAdvice(baseRequest, env, invoker)).rejects.toThrow("provider down");
    expect(invoker).toHaveBeenCalledTimes(1);
  });

  it("answers in a chosen philosopher's voice without using the axes", async () => {
    const invoker = vi.fn().mockResolvedValueOnce("## Core advice\n\nVoice answer");

    const response = await generateAdvice(
      {
        ...baseRequest,
        answers: [],
        personaMode: "philosopher",
        philosopherId: "nietzsche-perspectivism"
      },
      env,
      invoker
    );

    expect(response.selectedPhilosopherId).toBe("nietzsche-perspectivism");
    expect(response.profile).toBeUndefined();
    expect(response.nearestProfiles).toEqual([]);
    expect(invoker).toHaveBeenCalledTimes(1);
    const advisorPrompt = invoker.mock.calls[0][1] as string;
    expect(advisorPrompt).toContain("Friedrich Nietzsche");
    expect(advisorPrompt).toContain(baseRequest.dilemma);
    expect(advisorPrompt).not.toContain("Ethical tuple");
    expect(advisorPrompt).toContain("Do not add any disclaimer");
  });

  it("frames religious figures 'in the spirit of' rather than literal first person", async () => {
    const invoker = vi.fn().mockResolvedValueOnce("## Core advice\n\nOk");

    await generateAdvice(
      { ...baseRequest, answers: [], personaMode: "philosopher", philosopherId: "jesus-christian-ethics" },
      env,
      invoker
    );

    expect(invoker.mock.calls[0][1]).toContain("Write in the spirit of");
    expect(invoker.mock.calls[0][1]).toContain("Do not add any disclaimer");
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

  it("allows policy dilemmas about self-harm detection to reach the model", async () => {
    const invoker = vi
      .fn()
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
    expect(invoker).toHaveBeenCalledTimes(1);
  });
});
