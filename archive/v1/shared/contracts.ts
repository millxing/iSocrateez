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

export type PhilosophyGroup = "ancient" | "eastern" | "religious" | "modern" | "contemporary";

export type VoiceStyle = "first-person" | "in-the-spirit";

export interface PhilosophyProfile {
  id: string;
  name: string;
  representative: string;
  group: PhilosophyGroup;
  /** How the advice voice is framed: literal first person, or "in the spirit of". */
  voiceStyle: VoiceStyle;
  /** Core tenets, concerns, and tone, fed to the model when answering in this voice. */
  voiceBrief: string;
  speaker: {
    years: string;
    region: string;
    traditions: string;
  };
  /** Only profiles with coordinates take part in nearest-match ranking. */
  coordinates?: ProfileTuple;
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
  /** When set, advice is given in this philosopher's voice and the axes are ignored. */
  philosopherId?: string;
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
  /** Absent when the advice was given in a chosen philosopher's voice. */
  profile?: ProfileTuple;
  selectedPhilosopherId?: string;
  nearestProfiles: RankedProfile[];
  safetyMode: "standard" | "supportive_refusal";
  modelsUsed: string[];
  timing?: AdviceTiming;
}
