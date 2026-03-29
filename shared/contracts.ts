export type Axis =
  | "outcomesPrinciples"
  | "individualCollective"
  | "reasonIntuition";

export type ExplanationLevel = "general" | "informed" | "phd";

export type PersonaMode = "personalized" | "philosopher";

export type AnswerValue = -2 | -1 | 0 | 1 | 2;

export interface Question {
  id: string;
  axis: Axis;
  prompt: string;
  lowLabel: string;
  highLabel: string;
  polarity: 1 | -1;
}

export interface AnswerRecord {
  questionId: string;
  value: AnswerValue;
}

export interface ProfileTuple {
  outcomesPrinciples: number;
  individualCollective: number;
  reasonIntuition: number;
}

export interface PhilosophyProfile {
  id: string;
  name: string;
  representative: string;
  coordinates: ProfileTuple;
  summary: string;
  exampleConcerns: string[];
}

export interface RankedProfile extends PhilosophyProfile {
  distance: number;
  whyItFits: string;
}

export interface SessionResponse {
  token: string;
  expiresAt: string;
}

export interface AdviceRequest {
  token: string;
  dilemma: string;
  answers: AnswerRecord[];
  profileOverride?: ProfileTuple;
  explanationLevel: ExplanationLevel;
  personaMode: PersonaMode;
  plannerModel?: string;
  advisorModel?: string;
}

export interface AdviceTiming {
  plannerMs: number;
  advisorMs: number;
  totalMs: number;
}

export interface AdviceResponse {
  adviceMarkdown: string;
  profile: ProfileTuple;
  nearestProfiles: RankedProfile[];
  safetyMode: "standard" | "supportive_refusal";
  modelsUsed: string[];
  timing?: AdviceTiming;
}
