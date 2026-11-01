import type { AdviceRequest, AdviceResponse, AdviceTiming } from "../../shared/contracts";
import { rankPhilosophies, scoreProfile } from "../../shared/ethics";
import { getPhilosophyById } from "../../shared/philosophyProfiles";
import { questionBank } from "../../shared/questionBank";
import { assessSafety } from "./safety";
import {
  buildAdvisorPrompt,
  buildFallbackPrompt,
  buildPlannerPrompt,
  buildVoiceAdvisorPrompt,
  buildVoiceFallbackPrompt,
  buildVoicePlannerPrompt,
  type PlannerOutput
} from "./prompts";

export interface WorkerEnv {
  APP_SHARED_PASSWORD: string;
  JWT_SECRET: string;
  PLANNER_PROVIDER: string;
  PLANNER_MODEL: string;
  PLANNER_BASE_URL?: string;
  ADVISOR_PROVIDER: string;
  ADVISOR_MODEL: string;
  ADVISOR_BASE_URL?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ALLOWED_ORIGIN?: string;
}

interface ModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export type ModelInvoker = (config: ModelConfig, prompt: string) => Promise<string>;

function resolveModelConfig(
  override: string | undefined,
  defaultConfig: ModelConfig,
  env: WorkerEnv
): ModelConfig {
  if (!override) {
    return defaultConfig;
  }

  const colonIndex = override.indexOf(":");
  if (colonIndex === -1) {
    return defaultConfig;
  }

  const provider = override.slice(0, colonIndex);
  const model = override.slice(colonIndex + 1);
  const apiKey = getProviderApiKey(provider, env);

  return { provider, model, apiKey };
}

export async function generateAdvice(
  request: AdviceRequest,
  env: WorkerEnv,
  invokeModel: ModelInvoker = callModel
): Promise<AdviceResponse> {
  const totalStart = Date.now();
  const voice = request.philosopherId ? getPhilosophyById(request.philosopherId) : undefined;
  if (request.philosopherId && !voice) {
    throw new Error("Unknown philosopher.");
  }

  const profile = voice
    ? undefined
    : request.profileOverride || scoreProfile(request.answers, questionBank);
  const nearestProfiles = profile ? rankPhilosophies(profile).slice(0, 3) : [];
  // Fields describing who the advice is for/from; the same on every return path.
  const identity: Pick<AdviceResponse, "profile" | "nearestProfiles" | "selectedPhilosopherId"> = {
    profile,
    nearestProfiles,
    selectedPhilosopherId: voice?.id
  };

  const safety = assessSafety(
    request.dilemma,
    request.explanationLevel,
    request.personaMode
  );

  if (safety.mode === "supportive_refusal") {
    return {
      adviceMarkdown: safety.markdown || "I can't help with that request.",
      ...identity,
      safetyMode: safety.mode,
      modelsUsed: ["local-safety"]
    };
  }

  const defaultPlannerConfig: ModelConfig = {
    provider: env.PLANNER_PROVIDER,
    model: env.PLANNER_MODEL,
    apiKey: getProviderApiKey(env.PLANNER_PROVIDER, env),
    baseUrl: env.PLANNER_BASE_URL
  };
  const defaultAdvisorConfig: ModelConfig = {
    provider: env.ADVISOR_PROVIDER,
    model: env.ADVISOR_MODEL,
    apiKey: getProviderApiKey(env.ADVISOR_PROVIDER, env),
    baseUrl: env.ADVISOR_BASE_URL
  };

  const plannerConfig = resolveModelConfig(request.plannerModel, defaultPlannerConfig, env);
  const advisorConfig = resolveModelConfig(request.advisorModel, defaultAdvisorConfig, env);

  const context = {
    dilemma: request.dilemma,
    explanationLevel: request.explanationLevel,
    personaMode: request.personaMode,
    profile: profile as NonNullable<typeof profile>,
    nearestProfiles
  };
  const voiceContext = voice
    ? { dilemma: request.dilemma, explanationLevel: request.explanationLevel, voice }
    : undefined;

  const plannerPrompt = voiceContext
    ? buildVoicePlannerPrompt(voiceContext)
    : buildPlannerPrompt(context);
  const advisorPromptFor = (plannerOutput: PlannerOutput) =>
    voiceContext
      ? buildVoiceAdvisorPrompt(voiceContext, plannerOutput)
      : buildAdvisorPrompt(context, plannerOutput);
  const fallbackPrompt = voiceContext
    ? buildVoiceFallbackPrompt(voiceContext)
    : buildFallbackPrompt(context);

  try {
    const plannerStart = Date.now();
    const plannerRaw = await invokeModel(plannerConfig, plannerPrompt);
    const plannerMs = Date.now() - plannerStart;

    const plannerOutput = validatePlannerOutput(plannerRaw);

    const advisorStart = Date.now();
    const adviceMarkdown = await invokeModel(advisorConfig, advisorPromptFor(plannerOutput));
    const advisorMs = Date.now() - advisorStart;

    const timing: AdviceTiming = {
      plannerMs,
      advisorMs,
      totalMs: Date.now() - totalStart
    };

    return {
      adviceMarkdown,
      ...identity,
      safetyMode: "standard",
      modelsUsed: [
        `${plannerConfig.provider}:${plannerConfig.model}`,
        `${advisorConfig.provider}:${advisorConfig.model}`
      ],
      timing
    };
  } catch {
    const advisorStart = Date.now();
    const adviceMarkdown = await invokeModel(advisorConfig, fallbackPrompt);
    const advisorMs = Date.now() - advisorStart;

    const timing: AdviceTiming = {
      plannerMs: 0,
      advisorMs,
      totalMs: Date.now() - totalStart
    };

    return {
      adviceMarkdown,
      ...identity,
      safetyMode: "standard",
      modelsUsed: [`fallback:${advisorConfig.provider}:${advisorConfig.model}`],
      timing
    };
  }
}

export function validatePlannerOutput(raw: string): PlannerOutput {
  const parsed = JSON.parse(raw) as Partial<PlannerOutput>;

  if (
    typeof parsed.dilemmaSummary !== "string" ||
    !Array.isArray(parsed.keyTensions) ||
    typeof parsed.profileInterpretation !== "string" ||
    !Array.isArray(parsed.framingNotes) ||
    typeof parsed.advisorBrief !== "string" ||
    !Array.isArray(parsed.cautionPoints)
  ) {
    throw new Error("Planner output did not match the required JSON shape.");
  }

  return {
    dilemmaSummary: parsed.dilemmaSummary,
    keyTensions: parsed.keyTensions.map(String),
    profileInterpretation: parsed.profileInterpretation,
    framingNotes: parsed.framingNotes.map(String),
    advisorBrief: parsed.advisorBrief,
    cautionPoints: parsed.cautionPoints.map(String)
  };
}

function getProviderApiKey(provider: string, env: WorkerEnv): string | undefined {
  switch (provider) {
    case "openai":
      return env.OPENAI_API_KEY;
    case "anthropic":
      return env.ANTHROPIC_API_KEY;
    default:
      return undefined;
  }
}

async function callModel(config: ModelConfig, prompt: string): Promise<string> {
  if (!config.apiKey) {
    throw new Error(`Missing API key for ${config.provider}:${config.model}`);
  }

  switch (config.provider) {
    case "openai":
      return callOpenAiCompatible(config, prompt);
    case "anthropic":
      return callAnthropic(config, prompt);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

async function callOpenAiCompatible(
  config: ModelConfig,
  prompt: string
): Promise<string> {
  const endpoint = config.baseUrl || "https://api.openai.com/v1/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      // Newer reasoning-style models reject non-default temperature.
      ...(/^gpt-4/.test(config.model) ? { temperature: 0.7 } : {}),
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI-compatible request failed.");
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI-compatible provider returned no content.");
  }

  return content;
}

async function callAnthropic(config: ModelConfig, prompt: string): Promise<string> {
  const endpoint = config.baseUrl || "https://api.anthropic.com/v1/messages";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey || "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.model,
      // Headroom for thinking tokens, which count toward max_tokens on 5.x models.
      max_tokens: 8000,
      // Effort is only accepted by the 5.5 family (errors on Haiku 4.5).
      ...(/^claude-(haiku|sonnet|opus)-5-5/.test(config.model)
        ? { output_config: { effort: "medium" } }
        : {}),
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "Anthropic request failed.");
  }

  const content = data.content?.find((entry) => entry.type === "text")?.text;
  if (!content) {
    throw new Error("Anthropic provider returned no text.");
  }

  return content;
}
