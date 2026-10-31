import type { PersonaMessage } from "../shared/persona";
import type { DebugActionChoice } from "./types";

// SERVER-ONLY. Never import this file from a "use client" component or
// anything that ends up in the browser bundle - the whole point of this
// module is that the candidate's choice determines what they see next
// without the full decision tree ever being inspectable via devtools. Only
// app/api/wse/sessions/[id]/scenarios/debug-incident/branch/route.ts may
// import it.

export type BeatId = "start" | "final" | "resolved";

export interface BeatOption {
  choice: DebugActionChoice;
  nextBeatId: BeatId;
  reactionMessages: PersonaMessage[];
}

export interface Beat {
  id: BeatId;
  role: "interim" | "final" | "terminal";
  options: BeatOption[];
}

// Two real decision points (interim call, final call), each reacting
// distinctly to all four possible choices - this is what makes it a war
// room instead of a script: what the team says next depends on what the
// candidate actually picked, not just on how many times they clicked
// "Continue".
export const BRANCH_TABLE: Record<BeatId, Beat> = {
  start: {
    id: "start",
    role: "interim",
    options: [
      {
        choice: "rollback",
        nextBeatId: "final",
        reactionMessages: [
          {
            personaId: "platform",
            text: "A full rollback reverts everything from this morning's deploy, not just whatever's actually causing this — including changes nobody's flagged as suspect. And it's only Meridian that's affected; every other client is green. Are we sure a blanket rollback is the right blast radius before we've isolated what's actually different about their traffic?",
          },
          {
            personaId: "oncall-bot",
            text: "Meridian's failure rate is climbing — now affecting roughly 40% of their batch submissions.",
          },
        ],
      },
      {
        choice: "kill_switch",
        nextBeatId: "final",
        reactionMessages: [
          {
            personaId: "support",
            text: "Disabling batch submissions buys us time, but Meridian can't process any orders at all until we re-enable it — that trades a partial degradation for a full outage on their side. Their integration behaves differently from every other client's traffic pattern, for what it's worth.",
          },
          {
            personaId: "platform",
            text: "If we're just buying time, I'd rather spend the next few minutes actually looking at what changed this morning instead of parking this.",
          },
        ],
      },
      {
        choice: "scale_pool",
        nextBeatId: "final",
        reactionMessages: [
          {
            personaId: "platform",
            text: "Could help, but let's not guess at a number — pull the current setting and today's deploy diff before you touch anything, so we know what we're actually adjusting and by how much.",
          },
          {
            personaId: "oncall-bot",
            text: "Meridian's failure rate is climbing — now affecting roughly 40% of their batch submissions.",
          },
        ],
      },
      {
        choice: "keep_investigating",
        nextBeatId: "final",
        reactionMessages: [
          {
            personaId: "oncall-bot",
            text: "Understood, but this is live — Meridian's failure rate just climbed to roughly 40% of their batch submissions. We need a call soon.",
          },
          {
            personaId: "support",
            text: "Their integration behaves differently from every other client's — that's probably worth looking at first.",
          },
          {
            personaId: "platform",
            text: "Something changed in this morning's deploy. I'd start there before spending time elsewhere.",
          },
        ],
      },
    ],
  },
  final: {
    id: "final",
    role: "final",
    options: [
      {
        choice: "rollback",
        nextBeatId: "resolved",
        reactionMessages: [
          {
            personaId: "platform",
            text: "Understood — full rollback it is. I'll get that queued now. Heads up, it takes the rest of this morning's changes with it, not just the pool setting.",
          },
        ],
      },
      {
        choice: "kill_switch",
        nextBeatId: "resolved",
        reactionMessages: [
          {
            personaId: "support",
            text: "Kill switch is live for Meridian. I'll let their team know submissions are paused temporarily.",
          },
        ],
      },
      {
        choice: "scale_pool",
        nextBeatId: "resolved",
        reactionMessages: [
          {
            personaId: "platform",
            text: "Pool size bumped. Watching Meridian's error rate now — should clear within a minute or two.",
          },
        ],
      },
      {
        choice: "keep_investigating",
        nextBeatId: "resolved",
        reactionMessages: [
          {
            personaId: "oncall-bot",
            text: "Noted — but we're now well past initial triage with a climbing failure rate. This needs an action soon.",
          },
        ],
      },
    ],
  },
  resolved: { id: "resolved", role: "terminal", options: [] },
};

// Ambient pressure: an unprompted escalation that arrives if the candidate
// takes too long to make their first call, independent of anything they
// click. Fires at most once per session, checked against server time (never
// a client-supplied elapsed value) so it can't be dodged or faked.
export const AMBIENT_ESCALATION_THRESHOLD_MS = 90_000;
export const AMBIENT_ESCALATION_MESSAGE: PersonaMessage = {
  personaId: "support",
  text: "Following up — still waiting on a call here. Meridian's failure rate keeps climbing.",
};

export interface ResolveBranchResult {
  nextBeatId: BeatId;
  personaMessages: PersonaMessage[];
  ambientEscalationTriggered: boolean;
}

export function resolveBranch(
  currentBeatId: BeatId,
  choice: DebugActionChoice,
  serverElapsedMs: number,
  ambientEscalationAlreadyShown: boolean
): ResolveBranchResult | null {
  const beat = BRANCH_TABLE[currentBeatId];
  if (!beat || beat.options.length === 0) return null;

  const option = beat.options.find((o) => o.choice === choice);
  if (!option) return null;

  const shouldEscalate =
    !ambientEscalationAlreadyShown && serverElapsedMs >= AMBIENT_ESCALATION_THRESHOLD_MS;

  const personaMessages = shouldEscalate
    ? [AMBIENT_ESCALATION_MESSAGE, ...option.reactionMessages]
    : option.reactionMessages;

  return {
    nextBeatId: option.nextBeatId,
    personaMessages,
    ambientEscalationTriggered: shouldEscalate,
  };
}
