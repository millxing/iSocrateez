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

/** Plain-language reading of the tuple; the model follows this more reliably than the bare numbers. */
function profileLines(profile: ProfileTuple): string[] {
  return [
    `Ethical tuple: ${formatTuple(profile)}`,
    `Outcomes-Principles: ${describeAxisPosition("outcomesPrinciples", profile.outcomesPrinciples)}`,
    `Individual-Collective: ${describeAxisPosition("individualCollective", profile.individualCollective)}`,
    `Reason-Intuition: ${describeAxisPosition("reasonIntuition", profile.reasonIntuition)}`
  ];
}

const NO_FOLLOW_UP_NOTE =
  "Do not end with follow-up offers, suggestions to continue the conversation, or phrases like 'If you want, I can help you...' — end cleanly after the last section.";
const TENSIONS_NOTE =
  "Before you write, identify the moral tensions in the dilemma. Surface them in the advice; do not collapse them too quickly.";

export function buildAdvisorPrompt(context: PromptContext): string {
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
    NO_FOLLOW_UP_NOTE,
    TENSIONS_NOTE,
    "",
    `Original dilemma: ${context.dilemma}`,
    ...profileLines(context.profile),
    `Nearest philosophy: ${primary.name} via ${primary.representative}`,
    `Nearest philosophy summary: ${primary.summary}`
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

export function buildVoiceAdvisorPrompt(context: VoicePromptContext): string {
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
    NO_FOLLOW_UP_NOTE,
    TENSIONS_NOTE,
    "",
    `Original dilemma: ${context.dilemma}`
  ].join("\n");
}
