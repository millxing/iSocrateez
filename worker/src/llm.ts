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

import { callModel, getProviderApiKey, resolveModelConfig, type ModelConfig, type ModelInvoker, type WorkerEnv } from "./providers";
export { ProviderError, type ModelInvoker, type WorkerEnv } from "./providers";

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
