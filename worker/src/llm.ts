import type { AdviceRequest, AdviceResponse, AdviceTiming } from "../../shared/contracts";
import { rankPhilosophies, scoreProfile } from "../../shared/ethics";
import { getPhilosophyById } from "../../shared/philosophyProfiles";
import { questionBank } from "../../shared/questionBank";
import { assessSafety } from "./safety";
import { buildAdvisorPrompt, buildVoiceAdvisorPrompt } from "./prompts";

import { callModel, getProviderApiKey, resolveModelConfig, type ModelInvoker, type WorkerEnv } from "./providers";
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

  const advisorConfig = resolveModelConfig(
    request.advisorModel,
    {
      provider: env.ADVISOR_PROVIDER,
      model: env.ADVISOR_MODEL,
      apiKey: getProviderApiKey(env.ADVISOR_PROVIDER, env),
      baseUrl: env.ADVISOR_BASE_URL
    },
    env
  );

  // One model call. A separate planning call was measured and gave no better fit to the profile.
  const prompt = voice
    ? buildVoiceAdvisorPrompt({ dilemma: request.dilemma, explanationLevel: request.explanationLevel, voice })
    : buildAdvisorPrompt({
        dilemma: request.dilemma,
        explanationLevel: request.explanationLevel,
        personaMode: request.personaMode,
        profile: profile as NonNullable<typeof profile>,
        nearestProfiles
      });

  const advisorStart = Date.now();
  const adviceMarkdown = await invokeModel(advisorConfig, prompt);
  const timing: AdviceTiming = {
    advisorMs: Date.now() - advisorStart,
    totalMs: Date.now() - totalStart
  };

  return {
    adviceMarkdown,
    ...identity,
    safetyMode: "standard",
    modelsUsed: [`${advisorConfig.provider}:${advisorConfig.model}`],
    timing
  };
}
