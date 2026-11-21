import type { PhilosophyProfile, ProfileTuple } from "../../shared/contracts";
import { rankPhilosophies } from "../../shared/ethics";
import {
  adviceSections,
  buildAdvisorPrompt,
  buildVoiceAdvisorPrompt,
  commitRules,
  NO_FOLLOW_UP_NOTE,
  presentationGuidance
} from "../../worker/src/prompts";
import * as legacy from "./legacyPrompts";

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
  // The production prompts as they were until 2026-11-21. Frozen: see legacyPrompts.ts.
  legacy: { ...routes(legacy), baseline: ({ dilemma }) => legacy.buildBaselinePrompt({ dilemma, explanationLevel: "informed" }) }
};
