import type { AdviceRequest } from "../../shared/contracts";
import { createSignedToken, verifySignedToken } from "./auth";
import { generateAdvice, type WorkerEnv } from "./llm";

const SESSION_TTL_SECONDS = 60 * 60 * 12;

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return handleRequest(request, env);
  }
};

export async function handleRequest(
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({ ok: true }, 200);
  }

  if (request.method === "POST" && url.pathname === "/api/session") {
    const body = await safeJson<{ password?: string }>(request);

    if (!body?.password || body.password !== env.APP_SHARED_PASSWORD) {
      return json({ error: "Incorrect shared password." }, 401);
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
    const token = await createSignedToken(
      { exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
      env.JWT_SECRET
    );

    return json({ token, expiresAt }, 200);
  }

  if (request.method === "POST" && url.pathname === "/api/advice") {
    const body = await safeJson<AdviceRequest>(request);
    if (!body || typeof body.token !== "string") {
      return json({ error: "Invalid request body." }, 400);
    }

    const verified = await verifySignedToken(body.token, env.JWT_SECRET);
    if (!verified) {
      return json({ error: "Session expired or invalid." }, 401);
    }

    if (
      typeof body.dilemma !== "string" ||
      body.dilemma.trim().length < 10 ||
      !Array.isArray(body.answers) ||
      (!hasValidProfileOverride(body.profileOverride) && body.answers.length !== 9)
    ) {
      return json({ error: "Provide either 9 answers or a valid 3-number ethical tuple." }, 400);
    }

    try {
      const response = await generateAdvice(body, env);
      return json(response, 200);
    } catch {
      return json({ error: "Advice generation failed." }, 500);
    }
  }

  return json({ error: "Not found." }, 404);
}

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };
}

async function safeJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function hasValidProfileOverride(value: AdviceRequest["profileOverride"]) {
  if (!value) {
    return false;
  }

  return (
    isNormalizedNumber(value.outcomesPrinciples) &&
    isNormalizedNumber(value.individualCollective) &&
    isNormalizedNumber(value.reasonIntuition)
  );
}

function isNormalizedNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= -1 && value <= 1;
}
