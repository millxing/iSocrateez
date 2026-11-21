import type {
  ExplanationLevel,
  PersonaMode,
  PhilosophyProfile,
  ProfileTuple,
  RankedProfile
} from "../../shared/contracts";
import { describeAxisPosition, formatTuple } from "../../shared/ethics";

/*
 * The advice prompts ask the model to work out what the view concludes, and then to advise.
 * Asked only for "advice", the model gives its own best answer in the thinker's vocabulary, and
 * hedges between the options. Measured with experiments/verdict-check (2026-11-21): this form gave
 * the expected answer in 37 of 40 keyed cases (before: 32), and in 13 of 14 opposite-profile pairs (before: 3).
 * Test a change with that harness before you keep it.
 */

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

export const NO_FOLLOW_UP_NOTE =
  "Do not end with follow-up offers, suggestions to continue the conversation, or phrases like 'If you want, I can help you...' — end cleanly after the last section.";

/** Rules that make the advice answer the question. `unless` names the one permitted reason for a third option. */
export function commitRules(unless: string): string[] {
  return [
    "Rules:",
    "- Answer the question that the user asks. Take the facts as the user states them: if the user says that an option is closed, do not reopen it.",
    `- Do not replace the choice with a compromise or a third option, unless ${unless}. If you advise a first step (for example, to talk to someone), also say which option to choose if that step changes nothing.`,
    "- Do not balance all sides. Say in one or two sentences what this answer costs, then commit to it."
  ];
}

/** The five sections. The results page splits the advice on these headings (src/components/ResultsView.tsx). */
export function adviceSections(why: string, turnsOn: string): string[] {
  return [
    "Write concise, actionable markdown with these five sections, in this order, with these headings:",
    "1. Core advice",
    `2. ${why}`,
    "3. What this answer turns on",
    "4. What to watch for",
    "5. A concrete next step in the next 24 hours",
    "In \"Core advice\", the first sentence gives the answer.",
    `In "What this answer turns on", say in two to four sentences: ${turnsOn}`
  ];
}

export function buildAdvisorPrompt(context: PromptContext): string {
  const [primary] = context.nearestProfiles;
  const personaInstruction =
    context.personaMode === "philosopher"
      ? `Write in the first-person voice of ${primary.representative} representing ${primary.name}, while staying readable and concrete.`
      : "Write in a neutral but thoughtful advisory voice.";

  return [
    "You are the advice stage of an ethical reflection app.",
    "The user has an ethical profile on three axes, given below. The app tells the user that the advice reflects the user's own stated priorities, and is not a universal answer.",
    personaInstruction,
    `Presentation level: ${presentationGuidance(context.explanationLevel)}`,
    "",
    "Your first task is to work out the answer that follows from this profile. Do not give the advice that you think is best, and do not give balanced advice that any profile could receive. When a dilemma turns on these axes, a user at the opposite end of the axis must get a different answer.",
    "Before you write, work through these steps:",
    "1. Name the options that the user asks about.",
    "2. Find the axis or axes that this dilemma turns on: where would a person at the opposite end choose differently? A \"strongly\" position settles a conflict on its axis; it does not only tilt it. A \"balanced\" position does not decide.",
    "3. Reach the answer that follows from the user's positions on those axes.",
    "4. If no axis decides the dilemma, say so in one sentence, and give the advice that you judge best.",
    "5. Check the answer. If you softened it to make it more comfortable or more balanced, undo that.",
    "",
    ...commitRules("this profile leads there"),
    "",
    ...adviceSections(
      "Why this fits your ethical profile",
      "the axis and the fact that decide this case; and what a person at the opposite end of that axis would do."
    ),
    NO_FOLLOW_UP_NOTE,
    "",
    `Original dilemma: ${context.dilemma}`,
    ...profileLines(context.profile),
    `Nearest philosophy: ${primary.name} via ${primary.representative}`,
    `Nearest philosophy summary: ${primary.summary}`
  ].join("\n");
}

export function presentationGuidance(explanationLevel: ExplanationLevel): string {
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

/** The notes go in only when the profile has them, so a profile without notes gets the same prompt as before. */
function lensNoteLines(voice: PhilosophyProfile): string[] {
  if (!voice.lensNotes) return [];
  return [
    "Notes on this thinker. Use them in your reasoning. Do not quote them, and do not present them as the thinker's own words:",
    voice.lensNotes
  ];
}

const NO_DISCLAIMER_NOTE =
  "Do not add any disclaimer or aside saying this is an AI interpretation or not the person's real words; the app already shows that to the user.";

/**
 * Step 5 of the voice prompt: an explicit check against common sense, so that the model does not soften a
 * thinker's hard doctrines toward the modern answer. Added 2026-11-21 after the verdict check
 * (experiments/verdict-check, variant `contrast`): more expected disagreements on the development and holdout
 * splits, with no invented disagreement on the control cases.
 */
export const CONTRAST_STEP_5 = [
  "5. Check the answer against common sense, in this order:",
  "   a. Say to yourself the answer that a careful modern adviser with no philosophy would give.",
  "   b. List the doctrines of this thinker that modern readers find strict, hard or surprising and that bear on these facts: for example, acts the thinker forbids in all cases, duties to oneself, duties that come from a role or a relation, and what the thinker counts as no reason at all.",
  "   c. If one of these doctrines applies to these facts, follow it, even when the answer is harsh or unpopular, unless the thinker's own texts make an exception for a case of this kind. Do not soften it into the modern answer.",
  "   d. Do not invent a disagreement. If the thinker's reasoning leads to the same answer as the modern adviser, give that answer."
].join("\n");

export function buildVoiceAdvisorPrompt(context: VoicePromptContext): string {
  const { voice } = context;
  return [
    "You are the advice stage of an ethical reflection app.",
    "The user chose to look at a dilemma through one lens. The app tells the user that this is one perspective among many, and that it is an interpretation.",
    `Perspective: ${voiceIdentity(voice)}`,
    `Voice brief: ${voice.voiceBrief}`,
    ...lensNoteLines(voice),
    voiceInstruction(voice),
    NO_DISCLAIMER_NOTE,
    `Presentation level: ${presentationGuidance(context.explanationLevel)}`,
    "",
    "Your first task is to interpret. Work out what this thinker's ethics concludes about this case. Do not give the advice that you think is best, or the advice of a careful modern counsellor, unless this thinker's own reasoning leads there.",
    "Before you write, work through these steps:",
    "1. Name the options that the user asks about.",
    "2. Find the fact in this case that matters most to this thinker. Ask what this thinker treats as decisive, and what this thinker gives little weight although most people would weigh it.",
    "3. Reach the answer that follows. If the thinker's own texts speak to a case of this shape, follow them. A feature of the case does not decide it only because the thinker values that kind of thing in general: check that the thinker's reasoning applies to these facts.",
    "4. If the texts do not settle the case, say so in one sentence, and give the reading that you judge closest to them.",
    CONTRAST_STEP_5,
    "",
    ...commitRules("this thinker would"),
    "- Use the thinker's concepts correctly, and apply them to the facts given.",
    "",
    ...adviceSections(
      "Why this advice",
      "the fact that matters most to this thinker in this case; the change to that fact that would reverse the answer; and where most advisers would answer differently, if they would."
    ),
    NO_FOLLOW_UP_NOTE,
    "",
    `Original dilemma: ${context.dilemma}`
  ].join("\n");
}
