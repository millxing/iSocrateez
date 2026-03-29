import { describe, expect, it, vi } from "vitest";
import { createSignedToken } from "./auth";
import { handleRequest } from "./index";
import type { WorkerEnv } from "./llm";

const env: WorkerEnv = {
  APP_SHARED_PASSWORD: "open-sesame",
  JWT_SECRET: "jwt-secret",
  PLANNER_PROVIDER: "openai",
  PLANNER_MODEL: "planner-model",
  PLANNER_API_KEY: "planner-key",
  ADVISOR_PROVIDER: "openai",
  ADVISOR_MODEL: "advisor-model",
  ADVISOR_API_KEY: "advisor-key"
};

describe("worker routes", () => {
  it("rejects invalid session tokens", async () => {
    const request = new Request("https://example.com/api/advice", {
      method: "POST",
      body: JSON.stringify({
        token: "bad-token",
        dilemma: "A real dilemma with enough text.",
        explanationLevel: "general",
        personaMode: "personalized",
        answers: Array.from({ length: 9 }, (_, index) => ({
          questionId: `op-${index + 1}`,
          value: 0
        }))
      })
    });

    const response = await handleRequest(request, env);
    expect(response.status).toBe(401);
  });

  it("creates a session token for the shared password", async () => {
    const request = new Request("https://example.com/api/session", {
      method: "POST",
      body: JSON.stringify({ password: "open-sesame" })
    });

    const response = await handleRequest(request, env);
    const json = (await response.json()) as { token: string };

    expect(response.status).toBe(200);
    expect(json.token).toBeTruthy();
  });

  it("returns advice for a valid token", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    dilemmaSummary: "Summary",
                    keyTensions: ["loyalty", "truthfulness"],
                    profileInterpretation: "Outcome-aware and reason-first.",
                    framingNotes: ["Take the risk seriously."],
                    advisorBrief: "Recommend honest disclosure with care.",
                    cautionPoints: ["Do not moralize too quickly."]
                  })
                }
              }
            ]
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "## Core advice\n\nTell the truth, but do it with care."
                }
              }
            ]
          })
        )
      ) as typeof fetch;

    try {
      const token = await createSignedToken(
        { exp: Math.floor(Date.now() / 1000) + 60 },
        env.JWT_SECRET
      );
      const request = new Request("https://example.com/api/advice", {
        method: "POST",
        body: JSON.stringify({
          token,
          dilemma:
            "My friend wants me to hide a serious mistake that could hurt our team if it goes uncorrected.",
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
        })
      });

      const response = await handleRequest(request, env);
      const json = (await response.json()) as {
        adviceMarkdown: string;
        modelsUsed: string[];
      };

      expect(response.status).toBe(200);
      expect(json.adviceMarkdown).toContain("Tell the truth");
      expect(json.modelsUsed).toEqual(["openai:planner-model", "openai:advisor-model"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("accepts a manual tuple override without 9 answers", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    dilemmaSummary: "Summary",
                    keyTensions: ["privacy", "care"],
                    profileInterpretation: "Tuple provided manually.",
                    framingNotes: ["Honor the override."],
                    advisorBrief: "Respond from the supplied coordinates.",
                    cautionPoints: ["Do not recompute from answers."]
                  })
                }
              }
            ]
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "## Core advice\n\nUse the provided tuple."
                }
              }
            ]
          })
        )
      ) as typeof fetch;

    try {
      const token = await createSignedToken(
        { exp: Math.floor(Date.now() / 1000) + 60 },
        env.JWT_SECRET
      );
      const request = new Request("https://example.com/api/advice", {
        method: "POST",
        body: JSON.stringify({
          token,
          dilemma: "I want to skip the questionnaire and use my manual coordinates.",
          explanationLevel: "general",
          personaMode: "personalized",
          answers: [],
          profileOverride: {
            outcomesPrinciples: -0.5,
            individualCollective: 0.25,
            reasonIntuition: 0.75
          }
        })
      });

      const response = await handleRequest(request, env);
      const json = (await response.json()) as { profile: { outcomesPrinciples: number } };

      expect(response.status).toBe(200);
      expect(json.profile.outcomesPrinciples).toBe(-0.5);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
