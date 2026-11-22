import type { PhilosophyProfile, ProfileTuple } from "../../shared/contracts";
import { rankPhilosophies } from "../../shared/ethics";
import {
  adviceSections,
  buildAdvisorPrompt,
  buildVoiceAdvisorPrompt,
  commitRules,
  CONTRAST_STEP_5,
  NO_DISCLAIMER_NOTE,
  NO_FOLLOW_UP_NOTE,
  presentationGuidance,
  profileLines,
  voiceIdentity,
  voiceInstruction
} from "../../worker/src/prompts";
import * as legacy from "./legacyPrompts";
import { LENS_NOTES } from "./lensNotes";
import { PHILOSOPHER_SCORES, type DimensionScores } from "./philosopherScores";

/** A prompt variant builds the prompt for each of the app's two routes, and for a baseline with no philosopher. Add new variants here. */
export interface PromptVariant {
  voice(ctx: { dilemma: string; voice: PhilosophyProfile }): string;
  profile(ctx: { dilemma: string; profile: ProfileTuple }): string;
  baseline(ctx: { dilemma: string }): string;
}

/** The production structure with no philosopher and no profile: the control for "would any adviser say this?". */
export function buildBaselinePrompt(dilemma: string): string {
  return [
    "You are the advice stage of an ethical reflection app.",
    "Write in a neutral, thoughtful advisory voice.",
    `Presentation level: ${presentationGuidance("informed")}`,
    "",
    "Give the advice that you judge best.",
    "",
    ...commitRules("the case clearly requires it"),
    "",
    ...adviceSections(
      "Why this advice",
      "the fact that matters most in this case; and the change to that fact that would reverse the answer."
    ),
    NO_FOLLOW_UP_NOTE,
    "",
    `Original dilemma: ${dilemma}`
  ].join("\n");
}

type Builders = Pick<typeof legacy, "buildAdvisorPrompt" | "buildVoiceAdvisorPrompt">;

const routes = (builders: Builders): Pick<PromptVariant, "voice" | "profile"> => ({
  voice: ({ dilemma, voice }) => builders.buildVoiceAdvisorPrompt({ dilemma, explanationLevel: "informed", voice }),
  profile: ({ dilemma, profile }) =>
    builders.buildAdvisorPrompt({
      dilemma,
      explanationLevel: "informed",
      personaMode: "personalized",
      profile,
      nearestProfiles: rankPhilosophies(profile).slice(0, 3)
    })
});

export const VARIANTS: Record<string, PromptVariant> = {
  // The production prompts (worker/src/prompts.ts).
  prod: { ...routes({ buildAdvisorPrompt, buildVoiceAdvisorPrompt }), baseline: ({ dilemma }) => buildBaselinePrompt(dilemma) },
  // Step 4: the production prompts with the draft lens notes (lensNotes.ts) for the four test philosophers.
  // The profile and baseline prompts are the same as prod.
  notes: {
    ...routes({ buildAdvisorPrompt, buildVoiceAdvisorPrompt }),
    voice: ({ dilemma, voice }) =>
      buildVoiceAdvisorPrompt({ dilemma, explanationLevel: "informed", voice: { ...voice, lensNotes: LENS_NOTES[voice.id] } }),
    baseline: ({ dilemma }) => buildBaselinePrompt(dilemma)
  },
  // The voice prompt as it was before the contrast step went into production (2026-11-21): prod with step 5
  // replaced by the older, shorter check. Its answers are cached in data/verdict/ (formerly data/prod/).
  verdict: {
    ...routes({ buildAdvisorPrompt, buildVoiceAdvisorPrompt }),
    voice: ({ dilemma, voice }) =>
      replaceOnce(buildVoiceAdvisorPrompt({ dilemma, explanationLevel: "informed", voice }), CONTRAST_STEP_5, PRE_CONTRAST_STEP_5),
    baseline: ({ dilemma }) => buildBaselinePrompt(dilemma)
  },
  // The contrast step is now in production, so this variant is the same as prod. Kept so that data/contrast/ stays usable.
  contrast: { ...routes({ buildAdvisorPrompt, buildVoiceAdvisorPrompt }), baseline: ({ dilemma }) => buildBaselinePrompt(dilemma) },
  // Rob's hybrid idea (2026-11-21): on the philosopher path, the thinker's preset coordinates do most of the work,
  // and knowledge of the thinker overrides them only where a specific doctrine applies. Thinkers with no
  // coordinates get the prod prompt. The profile and baseline prompts are the same as prod.
  hybrid: {
    ...routes({ buildAdvisorPrompt, buildVoiceAdvisorPrompt }),
    voice: ({ dilemma, voice }) =>
      voice.coordinates
        ? buildHybridVoicePrompt(dilemma, voice)
        : buildVoiceAdvisorPrompt({ dilemma, explanationLevel: "informed", voice }),
    baseline: ({ dilemma }) => buildBaselinePrompt(dilemma)
  },
  // hybrid with Rob's 10-dimension scores (philosopherScores.ts: 6 moral foundations + 4 axes) in place of the
  // 3 app axes (2026-11-22). Same structure: the scores decide, a specific doctrine may override.
  hybrid10: {
    ...routes({ buildAdvisorPrompt, buildVoiceAdvisorPrompt }),
    voice: ({ dilemma, voice }) =>
      PHILOSOPHER_SCORES[voice.id]
        ? buildHybrid10VoicePrompt(dilemma, voice, PHILOSOPHER_SCORES[voice.id])
        : buildVoiceAdvisorPrompt({ dilemma, explanationLevel: "informed", voice }),
    baseline: ({ dilemma }) => buildBaselinePrompt(dilemma)
  },
  // hybrid10 with the facts read before the scores (2026-11-22): a concern counts only if a fact in the case
  // engages it, and no invented disagreement. Aim: the pairs, where hybrid10 gave the same answer to both versions.
  hybrid10f: {
    ...routes({ buildAdvisorPrompt, buildVoiceAdvisorPrompt }),
    voice: ({ dilemma, voice }) =>
      PHILOSOPHER_SCORES[voice.id]
        ? buildHybrid10VoicePrompt(dilemma, voice, PHILOSOPHER_SCORES[voice.id], FACTS_FIRST_STEPS)
        : buildVoiceAdvisorPrompt({ dilemma, explanationLevel: "informed", voice }),
    baseline: ({ dilemma }) => buildBaselinePrompt(dilemma)
  },
  // The production prompts as they were until 2026-11-21. Frozen: see legacyPrompts.ts.
  legacy: { ...routes(legacy), baseline: ({ dilemma }) => legacy.buildBaselinePrompt({ dilemma, explanationLevel: "informed" }) }
};

/** Step 5 of the voice prompt before the contrast step (variant `verdict`). Frozen. */
export const PRE_CONTRAST_STEP_5 =
  "5. Check the answer. If you softened it to make it more comfortable or more balanced, undo that. An answer that any sensible adviser would also give is acceptable when this thinker's reasoning leads there.";

export { CONTRAST_STEP_5 };

/** The hybrid voice prompt: the reasoning steps of the profile prompt, applied to the thinker's preset coordinates. */
export function buildHybridVoicePrompt(dilemma: string, voice: PhilosophyProfile): string {
  if (!voice.coordinates) throw new Error(`hybrid: ${voice.id} has no coordinates`);
  return [
    "You are the advice stage of an ethical reflection app.",
    "The user chose to look at a dilemma through one lens. The app tells the user that this is one perspective among many, and that it is an interpretation.",
    `Perspective: ${voiceIdentity(voice)}`,
    `Voice brief: ${voice.voiceBrief}`,
    voiceInstruction(voice),
    NO_DISCLAIMER_NOTE,
    `Presentation level: ${presentationGuidance("informed")}`,
    "",
    "This thinker has a fixed position on three ethical axes, given below. The answer must follow mainly from these positions.",
    ...profileLines(voice.coordinates),
    "",
    "Your first task is to work out the answer that follows from these positions. Do not give the advice that you think is best.",
    "Before you write, work through these steps:",
    "1. Name the options that the user asks about.",
    "2. Find the axis or axes that this dilemma turns on: where would a person at the opposite end choose differently? A \"strongly\" position settles a conflict on its axis; it does not only tilt it. A \"balanced\" position does not decide.",
    "3. Reach the answer that follows from the thinker's positions on those axes.",
    "4. Then check this thinker's own doctrines. Change the answer only if a specific doctrine of this thinker applies directly to these facts and points to the other option: for example, an act that the thinker forbids in all cases, or a duty that comes from a role or a relation. Otherwise keep the answer that the positions give.",
    "5. If no axis decides the dilemma and no doctrine applies, say so in one sentence, and give the reading that you judge closest to this thinker.",
    "6. Check the answer. If you softened it to make it more comfortable or more balanced, undo that.",
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
    `Original dilemma: ${dilemma}`
  ].join("\n");
}

/** Steps 2 to 6 of hybrid10. Frozen. */
export const HYBRID10_STEPS = [
    "2. Find the dimensions that this dilemma turns on: which concerns conflict here, and where would a thinker with different scores choose differently? A concern scored 8 or more, or an axis position of 2 or less or 8 or more, settles a conflict on that dimension; it does not only tilt it. Scores near the middle do not decide.",
    "3. Reach the answer that follows from the thinker's scores on those dimensions. When two strong concerns point to different options, the higher score wins.",
    "4. Then check this thinker's own doctrines. Change the answer only if a specific doctrine of this thinker applies directly to these facts and points to the other option: for example, an act that the thinker forbids in all cases, or a duty that comes from a role or a relation. Otherwise keep the answer that the scores give.",
    "5. If no dimension decides the dilemma and no doctrine applies, say so in one sentence, and give the reading that you judge closest to this thinker.",
    "6. Check the answer. If you softened it to make it more comfortable or more balanced, undo that."
];

/** Steps 2 to 7 of hybrid10f: read the facts before the scores. */
export const FACTS_FIRST_STEPS = [
  "2. Read the facts first. Name the concerns that these facts bring into play, and for each one the fact that brings it in. A concern that the thinker scores high does not count unless a fact in this case engages it. Ask also which change in the facts would remove it.",
  "3. Weigh only the concerns that the facts engage, using the thinker's scores. A concern scored 8 or more, or an axis position of 2 or less or 8 or more, settles a conflict on that dimension; it does not only tilt it. When two engaged concerns point to different options, the higher score wins. Scores near the middle do not decide.",
  "4. Then check this thinker's own doctrines. Change the answer only if a specific doctrine of this thinker applies directly to these facts and points to the other option: for example, an act that the thinker forbids in all cases, or a duty that comes from a role or a relation. Otherwise keep the answer that the scores give.",
  "5. Do not invent a disagreement. If the engaged concerns lead to the answer that a careful modern adviser would give, give that answer.",
  "6. If no dimension decides the dilemma and no doctrine applies, say so in one sentence, and give the reading that you judge closest to this thinker.",
  "7. Check the answer. If you softened it to make it more comfortable or more balanced, undo that."
];

function scoreLines(scores: DimensionScores): string[] {
  const n = (value: number) => value.toFixed(1);
  return [
    "How much weight this thinker gives to each moral concern (0 = none, 10 = the highest):",
    `- Care (preventing harm and suffering; compassion): ${n(scores.care)}`,
    `- Fairness (justice, rights, reciprocity, honest dealing): ${n(scores.fairness)}`,
    `- Loyalty (faithfulness to family, friends and one's group): ${n(scores.loyalty)}`,
    `- Authority (respect for roles, tradition and legitimate authority): ${n(scores.authority)}`,
    `- Sanctity (the sacred, purity, things that must not be degraded): ${n(scores.sanctity)}`,
    `- Liberty (freedom from coercion and domination; each person's right to decide for themselves): ${n(scores.liberty)}`,
    "Position on four axes (0 to 10):",
    `- Individual (0) to Collective (10): ${n(scores.individualCollective)}`,
    `- Outcomes (0) to Principles (10): ${n(scores.outcomesPrinciples)}`,
    `- Reason (0) to Intuition (10): ${n(scores.reasonIntuition)}`,
    `- Everyone equally (0) to My own people first (10): ${n(scores.impartialPartial)}`
  ];
}

/** hybrid with 10 dimensions: the scores decide, and a specific doctrine of the thinker may override them. */
export function buildHybrid10VoicePrompt(
  dilemma: string,
  voice: PhilosophyProfile,
  scores: DimensionScores,
  steps: string[] = HYBRID10_STEPS
): string {
  return [
    "You are the advice stage of an ethical reflection app.",
    "The user chose to look at a dilemma through one lens. The app tells the user that this is one perspective among many, and that it is an interpretation.",
    `Perspective: ${voiceIdentity(voice)}`,
    `Voice brief: ${voice.voiceBrief}`,
    voiceInstruction(voice),
    NO_DISCLAIMER_NOTE,
    `Presentation level: ${presentationGuidance("informed")}`,
    "",
    "This thinker has fixed scores on ten ethical dimensions, given below. The answer must follow mainly from these scores.",
    ...scoreLines(scores),
    "",
    "Your first task is to work out the answer that follows from these scores. Do not give the advice that you think is best.",
    "Before you write, work through these steps:",
    "1. Name the options that the user asks about.",
    ...steps,
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
    `Original dilemma: ${dilemma}`
  ].join("\n");
}

function replaceOnce(text: string, from: string, to: string): string {
  const parts = text.split(from);
  if (parts.length !== 2) throw new Error("variant: the production prompt text changed; update the variant");
  return parts.join(to);
}
