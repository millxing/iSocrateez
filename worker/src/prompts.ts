import type {
  ExplanationLevel,
  PersonaMode,
  PhilosophyProfile,
  ProfileTuple,
  RankedProfile
} from "../../shared/contracts";
import { describeAxisPosition, formatTuple } from "../../shared/ethics";

interface PromptContext {
  dilemma: string;
  explanationLevel: ExplanationLevel;
  personaMode: PersonaMode;
  profile: ProfileTuple;
  nearestProfiles: RankedProfile[];
}

export interface PlannerOutput {
  dilemmaSummary: string;
  keyTensions: string[];
  profileInterpretation: string;
  framingNotes: string[];
  advisorBrief: string;
  cautionPoints: string[];
}

export function buildPlannerPrompt(context: PromptContext): string {
  const [primary] = context.nearestProfiles;
  const modeNote =
    context.personaMode === "philosopher"
      ? `Snap the user to ${primary.name} as represented by ${primary.representative}. The later advice may be written in that voice.`
      : "Use the user’s measured profile directly without forcing them into a named school.";

  return [
    "You are the planning stage of an ethical advice system.",
    "Return strict JSON only with keys: dilemmaSummary, keyTensions, profileInterpretation, framingNotes, advisorBrief, cautionPoints.",
    "Do not include markdown fences or commentary outside the JSON object.",
    "",
    `Dilemma: ${context.dilemma}`,
    `Ethical tuple: ${formatTuple(context.profile)}`,
    `Outcomes-Principles: ${describeAxisPosition("outcomesPrinciples", context.profile.outcomesPrinciples)}`,
    `Individual-Collective: ${describeAxisPosition("individualCollective", context.profile.individualCollective)}`,
    `Reason-Intuition: ${describeAxisPosition("reasonIntuition", context.profile.reasonIntuition)}`,
    `Nearest philosophy: ${primary.name} via ${primary.representative}`,
    `Nearest philosophy summary: ${primary.summary}`,
    `Presentation level: ${presentationGuidance(context.explanationLevel)}`,
    `Mode: ${modeNote}`,
    "The planner should surface moral tensions, not collapse them too quickly."
  ].join("\n");
}

export function buildAdvisorPrompt(
  context: PromptContext,
  plannerOutput: PlannerOutput
): string {
  const [primary] = context.nearestProfiles;
  const personaInstruction =
    context.personaMode === "philosopher"
      ? `Write in the first-person voice of ${primary.representative} representing ${primary.name}, while staying readable and concrete.`
      : "Write in a neutral but thoughtful advisory voice aligned to the user’s profile.";

  return [
    "You are the advice stage of an ethical reflection app.",
    personaInstruction,
    `Presentation level: ${presentationGuidance(context.explanationLevel)}`,
    "Write concise, actionable markdown with these sections:",
    "1. Core advice",
    "2. Why this fits your ethical profile",
    "3. What to watch for",
    "4. A concrete next step in the next 24 hours",
    "Do not end with follow-up offers, suggestions to continue the conversation, or phrases like 'If you want, I can help you...' — end cleanly after the last section.",
    "",
    `Original dilemma: ${context.dilemma}`,
    `Ethical tuple: ${formatTuple(context.profile)}`,
    `Nearest philosophy: ${primary.name} via ${primary.representative}`,
    `Planner summary: ${plannerOutput.dilemmaSummary}`,
    `Planner key tensions: ${plannerOutput.keyTensions.join("; ")}`,
    `Planner profile interpretation: ${plannerOutput.profileInterpretation}`,
    `Planner framing notes: ${plannerOutput.framingNotes.join("; ")}`,
    `Planner caution points: ${plannerOutput.cautionPoints.join("; ")}`,
    `Advisor brief: ${plannerOutput.advisorBrief}`
  ].join("\n");
}

export function buildFallbackPrompt(context: PromptContext): string {
  const [primary] = context.nearestProfiles;
  const modeText =
    context.personaMode === "philosopher"
      ? `Answer as ${primary.representative} representing ${primary.name}.`
      : "Answer in a neutral voice aligned to the measured ethical profile.";

  return [
    "Provide ethical advice for the following dilemma.",
    modeText,
    `Presentation level: ${presentationGuidance(context.explanationLevel)}`,
    "Return markdown with the sections: Core advice, Why this fits your ethical profile, What to watch for, Next step.",
    "Do not end with follow-up offers, suggestions to continue the conversation, or phrases like 'If you want, I can help you...' — end cleanly after the last section.",
    `Dilemma: ${context.dilemma}`,
    `Tuple: ${formatTuple(context.profile)}`,
    `Nearest philosophy: ${primary.name} / ${primary.representative}`,
    `Primary fit explanation: ${primary.whyItFits}`
  ].join("\n");
}

function presentationGuidance(explanationLevel: ExplanationLevel): string {
  switch (explanationLevel) {
    case "general":
      return "Assume no philosophical training. Plain language, minimal jargon.";
    case "informed":
      return "Assume some philosophical training. Moderate precision, limited jargon.";
    case "phd":
      return "Assume PhD-level philosophical training. Use sharper distinctions and cleaner terminology.";
  }
}

interface VoicePromptContext {
  dilemma: string;
  explanationLevel: ExplanationLevel;
  voice: PhilosophyProfile;
}

function voiceIdentity(voice: PhilosophyProfile): string {
  return `${voice.representative} (${voice.name}; ${voice.speaker.years}; ${voice.speaker.traditions})`;
}

function voiceInstruction(voice: PhilosophyProfile): string {
  return voice.voiceStyle === "first-person"
    ? `Write in the first-person voice of ${voice.representative}, staying faithful to their actual views and manner, readable and concrete. Do not invent specific quotations or cite works they did not write.`
    : `Write in the spirit of ${voice.representative} (${voice.name}), as that tradition would counsel. Do not claim to literally be this person and do not put invented quotations in their mouth; phrases like "In this tradition…" or "From this perspective…" are fine, and you may speak in a warm second person to the user.`;
}

const NO_DISCLAIMER_NOTE =
  "Do not add any disclaimer or aside saying this is an AI interpretation or not the person's real words; the app already shows that to the user.";

export function buildVoicePlannerPrompt(context: VoicePromptContext): string {
  const { voice } = context;
  return [
    "You are the planning stage of an ethical advice system.",
    "Return strict JSON only with keys: dilemmaSummary, keyTensions, profileInterpretation, framingNotes, advisorBrief, cautionPoints.",
    "Do not include markdown fences or commentary outside the JSON object.",
    "",
    `Dilemma: ${context.dilemma}`,
    `The advice will be given from the perspective of: ${voiceIdentity(voice)}`,
    `Voice brief: ${voice.voiceBrief}`,
    `Presentation level: ${presentationGuidance(context.explanationLevel)}`,
    "Use profileInterpretation to describe how this thinker or tradition would read the dilemma.",
    "The planner should surface moral tensions, not collapse them too quickly."
  ].join("\n");
}

export function buildVoiceAdvisorPrompt(
  context: VoicePromptContext,
  plannerOutput: PlannerOutput
): string {
  const { voice } = context;
  return [
    "You are the advice stage of an ethical reflection app.",
    voiceInstruction(voice),
    NO_DISCLAIMER_NOTE,
    `Perspective: ${voiceIdentity(voice)}`,
    `Voice brief: ${voice.voiceBrief}`,
    `Presentation level: ${presentationGuidance(context.explanationLevel)}`,
    "Write concise, actionable markdown with these sections:",
    "1. Core advice",
    "2. Why this advice",
    "3. What to watch for",
    "4. A concrete next step in the next 24 hours",
    "Do not end with follow-up offers, suggestions to continue the conversation, or phrases like 'If you want, I can help you...' — end cleanly after the last section.",
    "",
    `Original dilemma: ${context.dilemma}`,
    `Planner summary: ${plannerOutput.dilemmaSummary}`,
    `Planner key tensions: ${plannerOutput.keyTensions.join("; ")}`,
    `How this perspective reads the dilemma: ${plannerOutput.profileInterpretation}`,
    `Planner framing notes: ${plannerOutput.framingNotes.join("; ")}`,
    `Planner caution points: ${plannerOutput.cautionPoints.join("; ")}`,
    `Advisor brief: ${plannerOutput.advisorBrief}`
  ].join("\n");
}

export function buildVoiceFallbackPrompt(context: VoicePromptContext): string {
  const { voice } = context;
  return [
    "Provide ethical advice for the following dilemma.",
    voiceInstruction(voice),
    NO_DISCLAIMER_NOTE,
    `Perspective: ${voiceIdentity(voice)}`,
    `Voice brief: ${voice.voiceBrief}`,
    `Presentation level: ${presentationGuidance(context.explanationLevel)}`,
    "Return markdown with the sections: Core advice, Why this advice, What to watch for, Next step.",
    "Do not end with follow-up offers, suggestions to continue the conversation, or phrases like 'If you want, I can help you...' — end cleanly after the last section.",
    `Dilemma: ${context.dilemma}`
  ].join("\n");
}
