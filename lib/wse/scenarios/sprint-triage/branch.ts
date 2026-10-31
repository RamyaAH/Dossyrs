import type { PersonaMessage } from "../shared/persona";

// SERVER-ONLY. Never import from a "use client" component - see the same
// rule and rationale in debug-incident/branch.ts. Deliberately a plain
// switch, not a lookup table: with only 2 choices and 1 decision point (two
// checkpoints, not a branching tree), a table would imply more structure
// than actually exists here.

export type BeatId = "pushback" | "confirm" | "resolved";

export interface ResolveBranchResult {
  nextBeatId: BeatId;
  personaMessages: PersonaMessage[];
}

export function resolveBranch(
  currentBeatId: BeatId,
  action: "held" | "changed"
): ResolveBranchResult | null {
  if (currentBeatId === "pushback") {
    const personaMessages: PersonaMessage[] =
      action === "held"
        ? [
            {
              personaId: "sales",
              text: "Understood — I'll tell them it's not this sprint. Can you confirm there's really no room before I go back to them?",
            },
          ]
        : [
            {
              personaId: "em",
              text: "Hold on — swapping something in mid-sprint means cutting one of the top 3 to stay within the 3-day capacity. Which one gives?",
            },
          ];
    return { nextBeatId: "confirm", personaMessages };
  }

  if (currentBeatId === "confirm") {
    const personaMessages: PersonaMessage[] =
      action === "held"
        ? [{ personaId: "sales", text: "Got it — holding. I'll manage expectations with the client." }]
        : [{ personaId: "em", text: "Okay — as long as the capacity tradeoff is accounted for, that's your call." }];
    return { nextBeatId: "resolved", personaMessages };
  }

  return null;
}
