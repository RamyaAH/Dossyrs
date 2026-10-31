import type { PersonaMessage } from "../shared/persona";
import { AMBIGUOUS_REQUEST_ANSWERS } from "./content";

// SERVER-ONLY. Never import from a "use client" component - same rule as
// every other scenario's branch.ts. No beat/state machine needed here
// (unlike debug-incident/sprint-triage) since this is a single round trip,
// not a multi-checkpoint exchange - the anti-gaming protection lives in
// the API route (a server-side "already asked" lock), not in branching
// state.

const ALREADY_ANSWERED_REDIRECT =
  "That's already covered in the brief for this MVP — no need to ask again.";

export function resolvePmAnswers(selectedQuestionIds: string[]): PersonaMessage[] {
  return selectedQuestionIds.map((id) => ({
    personaId: "pm",
    text: AMBIGUOUS_REQUEST_ANSWERS[id] ?? ALREADY_ANSWERED_REDIRECT,
  }));
}
