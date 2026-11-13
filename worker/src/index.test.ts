import { describe, expect, it, vi } from "vitest";
import { createSignedToken } from "./auth";
import { handleRequest } from "./index";
import type { WorkerEnv } from "./llm";
import { MAX_DILEMMA_CHARACTERS } from "../../shared/contracts";

const env: WorkerEnv = {
  APP_SHARED_PASSWORD: "open-sesame",
  JWT_SECRET: "jwt-secret",
  ADVISOR_PROVIDER: "openai",
  ADVISOR_MODEL: "advisor-model",
  OPENAI_API_KEY: "openai-key",
  ALLOWED_ORIGIN: "https://millxing.github.io"
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
      expect(json.modelsUsed).toEqual(["openai:advisor-model"]);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
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

  it("rejects model overrides that are not in the allowlist", async () => {
    const token = await createSignedToken(
      { exp: Math.floor(Date.now() / 1000) + 60 },
      env.JWT_SECRET
    );
    const request = new Request("https://example.com/api/advice", {
      method: "POST",
      body: JSON.stringify({
        token,
        dilemma: "A real dilemma with enough text.",
        explanationLevel: "general",
        personaMode: "personalized",
        answers: [],
        profileOverride: {
          outcomesPrinciples: 0,
          individualCollective: 0,
          reasonIntuition: 0
        },
        advisorModel: "anthropic:claude-fable-5-1"
      })
    });

    const response = await handleRequest(request, env);
    expect(response.status).toBe(400);
  });

  it("rejects an unknown philosopherId", async () => {
    const token = await createSignedToken(
      { exp: Math.floor(Date.now() / 1000) + 60 },
      env.JWT_SECRET
    );
    const request = new Request("https://example.com/api/advice", {
      method: "POST",
      body: JSON.stringify({
        token,
        dilemma: "A real dilemma with enough text.",
        explanationLevel: "general",
        personaMode: "philosopher",
        answers: [],
        philosopherId: "not-a-philosopher"
      })
    });

    const response = await handleRequest(request, env);
    expect(response.status).toBe(400);
  });

  it("rejects answer sets that cannot be scored before calling a model", async () => {
    const token = await createSignedToken(
      { exp: Math.floor(Date.now() / 1000) + 60 },
      env.JWT_SECRET
    );
    const valid = ["op-1", "op-2", "op-3", "ic-1", "ic-2", "ic-3", "ri-1", "ri-2", "ri-3"].map(
      (questionId) => ({ questionId, value: 0 })
    );
    const invalidSets = [
      valid.slice(1),
      [...valid.slice(1), valid[1]],
      [...valid.slice(1), { questionId: "op-99", value: 0 }],
      [...valid.slice(1), { questionId: "op-1", value: 5 }]
    ];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();

    try {
      for (const answers of invalidSets) {
        const response = await handleRequest(
          new Request("https://example.com/api/advice", {
            method: "POST",
            body: JSON.stringify({
              token,
              dilemma: "A real dilemma with enough text.",
              explanationLevel: "general",
              personaMode: "personalized",
              answers
            })
          }),
          env
        );
        expect(response.status).toBe(400);
      }
      expect(globalThis.fetch).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("only allows CORS for the configured origin", async () => {
    const allowed = await handleRequest(
      new Request("https://example.com/api/health", {
        headers: { Origin: "https://millxing.github.io" }
      }),
      env
    );
    expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://millxing.github.io"
    );

    const blocked = await handleRequest(
      new Request("https://example.com/api/health", {
        headers: { Origin: "https://evil.example" }
      }),
      env
    );
    expect(blocked.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
  it("reports provider authentication errors without exposing raw provider details", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(
      JSON.stringify({ error: { message: "sensitive upstream diagnostic" } }), { status: 401 }
    ));
    try {
      const token = await createSignedToken({ exp: Math.floor(Date.now() / 1000) + 60 }, env.JWT_SECRET);
      const response = await handleRequest(new Request("https://example.com/api/advice", {
        method: "POST",
        body: JSON.stringify({ token, dilemma: "Should I return a lost umbrella?", answers: [],
          profileOverride: { outcomesPrinciples: 0, individualCollective: 0, reasonIntuition: 0 },
          explanationLevel: "general", personaMode: "personalized" })
      }), env);
      expect(response.status).toBe(502);
      const body = await response.text();
      expect(body).toContain("OpenAI rejected its API key");
      expect(body).not.toContain("sensitive upstream diagnostic");
    } finally { fetchMock.mockRestore(); }
  });

  it("rejects a dilemma that is too long before calling the model", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    try {
      const token = await createSignedToken({ exp: Math.floor(Date.now() / 1000) + 60 }, env.JWT_SECRET);
      const request = (dilemma: string) => new Request("https://example.com/api/advice", {
        method: "POST",
        body: JSON.stringify({ token, dilemma, answers: [],
          profileOverride: { outcomesPrinciples: 0, individualCollective: 0, reasonIntuition: 0 },
          explanationLevel: "general", personaMode: "personalized" })
      });
      const response = await handleRequest(request("x".repeat(MAX_DILEMMA_CHARACTERS + 1)), env);
      expect(response.status).toBe(400);
      expect(await response.text()).toContain("12,000 characters");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { fetchMock.mockRestore(); }
  });

});
