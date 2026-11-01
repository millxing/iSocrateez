import type { ExplanationLevel, PersonaMode } from "../../shared/contracts";

export interface SafetyResult {
  mode: "standard" | "supportive_refusal";
  markdown?: string;
}

const selfHarmSignals = [
  "kill myself",
  "end my life",
  "suicide",
  "self-harm",
  "hurt myself"
];

const violentSignals = ["murder", "kill them", "poison", "assault", "bomb"];
const dangerousSignals = ["blackmail", "fraud", "steal", "hack into", "cover up evidence"];

const instructionSignals = [
  "how to",
  "ways to",
  "best way to",
  "help me",
  "should i",
  "can i",
  "want to",
  "planning to",
  "plan to",
  "thinking about"
];

const selfReferentialSignals = ["i ", "i'm", "i am", "me ", "my ", "myself"];

export function assessSafety(
  dilemma: string,
  explanationLevel: ExplanationLevel,
  personaMode: PersonaMode
): SafetyResult {
  const normalized = normalize(dilemma);

  if (isDirectSelfHarmRequest(normalized)) {
    return {
      mode: "supportive_refusal",
      markdown: buildSelfHarmResponse(explanationLevel)
    };
  }

  if (isHarmfulWrongdoingRequest(normalized)) {
    return {
      mode: "supportive_refusal",
      markdown: buildDangerousRequestResponse(explanationLevel, personaMode)
    };
  }

  return { mode: "standard" };
}

function matchesAny(value: string, candidates: string[]) {
  return candidates.some((candidate) => value.includes(candidate));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isDirectSelfHarmRequest(value: string) {
  if (!matchesAny(value, selfHarmSignals)) {
    return false;
  }

  if (containsInstructionalPair(value, selfHarmSignals)) {
    return true;
  }

  const firstPersonWithSelfHarm = hasWindowedPair(
    value,
    selfReferentialSignals,
    selfHarmSignals
  );

  if (!firstPersonWithSelfHarm) {
    return false;
  }

  const distancingMarkers = [
    "risk of self-harm",
    "risk of suicide",
    "predicts",
    "prediction",
    "model",
    "users",
    "user",
    "patient",
    "patients",
    "policy",
    "feature",
    "dashboard",
    "startup",
    "app",
    "authorities",
    "emergency contacts"
  ];

  return !matchesAny(value, distancingMarkers);
}

function isHarmfulWrongdoingRequest(value: string) {
  const allSignals = [...violentSignals, ...dangerousSignals];

  if (!matchesAny(value, allSignals)) {
    return false;
  }

  return containsInstructionalPair(value, allSignals);
}

function containsInstructionalPair(value: string, targets: string[]) {
  return hasWindowedPair(value, instructionSignals, targets);
}

function hasWindowedPair(value: string, leftTerms: string[], rightTerms: string[]) {
  return leftTerms.some((leftTerm) =>
    rightTerms.some((rightTerm) => {
      const safeLeft = escapeRegExp(leftTerm);
      const safeRight = escapeRegExp(rightTerm);

      return (
        new RegExp(`${safeLeft}[\\s\\S]{0,80}${safeRight}`).test(value) ||
        new RegExp(`${safeRight}[\\s\\S]{0,80}${safeLeft}`).test(value)
      );
    })
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSelfHarmResponse(explanationLevel: ExplanationLevel): string {
  if (explanationLevel === "phd") {
    return [
      "## I can’t help with self-harm planning",
      "",
      "What you’ve described sounds urgent enough that the right next move is human support, not moral optimization.",
      "",
      "Please contact emergency services or a crisis resource now. In the U.S. or Canada, call or text **988**. If you are elsewhere, contact a local crisis line or emergency number immediately.",
      "",
      "If you can, tell one trusted person near you right now: `I am not safe on my own and need you with me.`"
    ].join("\n");
  }

  return [
    "## I can’t help with that",
    "",
    "If this dilemma is about harming yourself, please reach out to a real person right now.",
    "",
    "In the U.S. or Canada, call or text **988**. If you are in immediate danger, call emergency services now.",
    "",
    "A simple message you can send is: `I need help staying safe right now. Can you stay with me?`"
  ].join("\n");
}

function buildDangerousRequestResponse(
  explanationLevel: ExplanationLevel,
  personaMode: PersonaMode
): string {
  const framing =
    explanationLevel === "phd"
      ? "I can help think through the ethical conflict, but not provide instructions for harming, coercing, or exploiting someone."
      : "I can help with the ethics of the situation, but not with instructions for harming or exploiting someone.";

  const note =
    personaMode === "philosopher"
      ? "If you want, reframe the situation around what a defensible, non-harmful course of action would look like."
      : "If you want, restate the dilemma in a way that focuses on the most defensible non-harmful options.";

  return ["## I can’t help with harmful wrongdoing", "", framing, "", note].join("\n");
}
