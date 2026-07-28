import type { DebugIncidentUpdate } from "./content";
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
  reactionMessages: DebugIncidentUpdate[];
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
            text: "Hold on — a full rollback reverts everything from this morning's deploy, not just the pool change. Before we do that: Meridian submits orders in batches of 50-200 per call, and this morning we dropped the shared connection pool from 50 to 12 as a cost cut. That's almost certainly the trigger.",
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
            text: "Disabling batch submissions buys us time, but Meridian can't process any orders until we re-enable it — that's a full outage for one client instead of a partial one. Worth knowing: they submit in batches of 50-200, unlike everyone else.",
          },
          {
            personaId: "platform",
            text: "Also worth flagging — this morning's deploy dropped the shared connection pool from 50 to 12. That's likely the actual trigger.",
          },
        ],
      },
      {
        choice: "scale_pool",
        nextBeatId: "final",
        reactionMessages: [
          {
            personaId: "platform",
            text: "That's the right instinct — we dropped the pool from 50 to 12 this morning as a cost cut, and Meridian's batches of 50-200 hold connections far longer than everyone else's single-order calls. Raising it back should relieve this quickly.",
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
            text: "Meridian's integration submits orders in batches of 50-200 per call, unlike our other clients who submit one at a time.",
          },
          {
            personaId: "platform",
            text: "Heads up — this morning's deploy dropped the order-db connection pool from 50 to 12 connections, as a cost optimization.",
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
export const AMBIENT_ESCALATION_MESSAGE: DebugIncidentUpdate = {
  personaId: "support",
  text: "Following up — still waiting on a call here. Meridian's failure rate keeps climbing.",
};

export interface ResolveBranchResult {
  nextBeatId: BeatId;
  personaMessages: DebugIncidentUpdate[];
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
