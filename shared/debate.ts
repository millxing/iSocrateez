import type { DebateParticipants } from "./contracts";

export const DEBATE_LIMITS = {
  philosopherTurns: 6,
  userExchanges: 6,
  dilemmaCharacters: 12000,
  userMessageCharacters: 2000,
  philosopherMessageCharacters: 6000,
  requestBytes: 100000
} as const;

export function debateMessageLimit(participants: DebateParticipants): number {
  return participants.mode === "philosophers"
    ? DEBATE_LIMITS.philosopherTurns
    : DEBATE_LIMITS.userExchanges * 2;
}

export function debateSpeakerAt(participants: DebateParticipants, index: number): string {
  return participants.mode === "philosophers"
    ? participants.philosopherIds[index % 2]
    : index % 2 === 0 ? "user" : participants.philosopherIds[0];
}
