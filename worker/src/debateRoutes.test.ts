import { afterEach, describe, expect, it, vi } from "vitest";
import { createSignedToken } from "./auth";
import { handleRequest } from "./index";
import type { WorkerEnv } from "./providers";

const env: WorkerEnv = {
  APP_SHARED_PASSWORD: "test", JWT_SECRET: "secret",
  ADVISOR_PROVIDER: "openai", ADVISOR_MODEL: "advisor", OPENAI_API_KEY: "test", ALLOWED_ORIGIN: "https://example.com"
};
const base = { dilemma: "Should I tell my friend about a mistake?", explanationLevel: "general", messages: [],
  participants: { mode: "philosophers", philosopherIds: ["kant-deontology", "mill-utilitarianism"] } };
async function send(overrides: object = {}) {
  const token = await createSignedToken({ exp: Math.floor(Date.now() / 1000) + 60 }, env.JWT_SECRET);
  return handleRequest(new Request("https://example.com/api/debate/turn", {
    method: "POST", headers: { Origin: "https://example.com" }, body: JSON.stringify({ ...base, token, ...overrides })
  }), env);
}
afterEach(() => vi.restoreAllMocks());

describe("debate route", () => {
  it("authenticates before calling a provider", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    expect((await send({ token: "bad-token" })).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects invalid order and models before calling a provider", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    expect((await send({ messages: [{ speakerId: "user", content: "I disagree" }] })).status).toBe(400);
    expect((await send({ advisorModel: "openai:unknown" })).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("returns one attributed reply with CORS headers", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "Consider your duty." } }] })));
    const response = await send();
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    expect(await response.json()).toMatchObject({ message: { speakerId: "kant-deontology", content: "Consider your duty." }, complete: false });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("returns a safe provider error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: { message: "secret-provider-detail" } }), { status: 429 }));
    const response = await send();
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("secret-provider-detail");
  });
  it("rejects oversized bodies and malformed JSON", async () => {
    expect((await send({ extra: "x".repeat(100001) })).status).toBe(413);
    const response = await handleRequest(new Request("https://example.com/api/debate/turn", { method: "POST", body: "{" }), env);
    expect(response.status).toBe(400);
  });
});
