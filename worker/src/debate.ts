import type { DebateTurnRequest, DebateTurnResponse } from "../../shared/contracts";
import { DEBATE_LIMITS, debateMessageLimit, debateSpeakerAt } from "../../shared/debate";
import { getPhilosophyById } from "../../shared/philosophyProfiles";
import { isAllowedModel } from "../../shared/models";
import { assessSafety } from "./safety";
import { buildDebatePrompt } from "./debatePrompts";
import { callModel, getProviderApiKey, resolveModelConfig, type ModelInvoker, type WorkerEnv } from "./providers";

export function isDebateTurnRequest(value: unknown): value is DebateTurnRequest {
  if (!value || typeof value !== "object") return false;
  const body = value as Partial<DebateTurnRequest>;
  const participants = body.participants;
  if (typeof body.token !== "string" || typeof body.dilemma !== "string" ||
      body.dilemma.trim().length < 10 || body.dilemma.length > DEBATE_LIMITS.dilemmaCharacters ||
      !["general", "informed", "phd"].includes(body.explanationLevel ?? "") ||
      (body.advisorModel !== undefined && !isAllowedModel(body.advisorModel)) ||
      !participants || !["philosophers", "user"].includes(participants.mode) ||
      !Array.isArray(participants.philosopherIds) ||
      participants.philosopherIds.length !== (participants.mode === "philosophers" ? 2 : 1) ||
      !participants.philosopherIds.every(id => typeof id === "string" && Boolean(getPhilosophyById(id))) ||
      new Set(participants.philosopherIds).size !== participants.philosopherIds.length ||
      !Array.isArray(body.messages) || body.messages.length >= debateMessageLimit(participants)) return false;

  if (participants.mode === "user" && body.messages.length % 2 !== 1) return false;
  return body.messages.every((message, index) =>
    message && typeof message === "object" &&
    message.speakerId === debateSpeakerAt(participants, index) &&
    typeof message.content === "string" && message.content.trim().length > 0 &&
    message.content.length <= (message.speakerId === "user"
      ? DEBATE_LIMITS.userMessageCharacters : DEBATE_LIMITS.philosopherMessageCharacters));
}

export async function generateDebateTurn(
  request: DebateTurnRequest,
  env: WorkerEnv,
  invokeModel: ModelInvoker = callModel
): Promise<DebateTurnResponse> {
  // Check each user contribution separately so unrelated context cannot mask a safety signal.
  const userTexts = [request.dilemma, ...request.messages.filter(m => m.speakerId === "user").map(m => m.content)];
  for (const text of userTexts) {
    const safety = assessSafety(text, request.explanationLevel, "personalized");
    if (safety.mode === "supportive_refusal") {
      return { safetyMode: safety.mode, safetyMarkdown: safety.markdown || "This debate has stopped. Please focus on a safe course of action.", complete: true, modelUsed: "local-safety" };
    }
  }
  const speakerId = debateSpeakerAt(request.participants, request.messages.length);
  const speaker = getPhilosophyById(speakerId);
  if (!speaker) throw new Error("Unknown philosopher.");
  const config = resolveModelConfig(request.advisorModel, {
    provider: env.ADVISOR_PROVIDER,
    model: env.ADVISOR_MODEL,
    apiKey: getProviderApiKey(env.ADVISOR_PROVIDER, env),
    baseUrl: env.ADVISOR_BASE_URL
  }, env);
  const content = (await invokeModel(config, buildDebatePrompt(request, speaker))).trim();
  if (!content || content.length > DEBATE_LIMITS.philosopherMessageCharacters) {
    throw new Error("The reply did not fit the debate limits.");
  }
  return {
    safetyMode: "standard",
    message: { speakerId, content },
    complete: request.messages.length + 1 >= debateMessageLimit(request.participants),
    modelUsed: `${config.provider}:${config.model}`
  };
}
