import type { DimensionScores, InputEvent } from "@/lib/wse/types";
import type { DebugActionChoice, DebugIncidentPayload } from "./types";

const MIN_ANSWER_LENGTH = 15;

const GOOD_CHOICES: DebugActionChoice[] = ["rollback", "scale_pool"];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function isLongEnough(text: string): boolean {
  return text.trim().length >= MIN_ANSWER_LENGTH;
}

// Concept groups matched against the combined root cause + fix text.
// Each group is a set of synonyms; a group counts as "hit" if any synonym
// appears. This is a deterministic keyword rubric, not NLP/ML.
const TAI_CONCEPT_GROUPS: RegExp[] = [
  /pool.?size|connection pool|db.?pool/i,
  /batch/i,
  /exhaust|timed?\s*out|timeout/i,
  /\b12\b.{0,20}\b50\b|\b50\b.{0,20}\b12\b|reduced|shrunk|decreased/i,
];

const IS_EVIDENCE_TOKENS: RegExp[] = [
  /\b12\b/,
  /\b50\b/,
  /meridian/i,
  /batch/i,
  /db_pool_config|pool_size/i,
];

const SA_RISK_KEYWORDS = /monitor|rollback|alert|watch|canary|gradual|risk/i;

// Restoring toward the pre-regression value (50) is full credit; a partial
// bump (still above the broken 12, short of a generous floor) is partial
// credit. This is a structural regex check on the final edited source —
// never an execution/compilation check — consistent with every other
// score.ts in this codebase: no NLP/ML, no running untrusted code.
const POOL_SIZE_TARGET_MIN = 40;

export function scoreCodeEdit(payload: DebugIncidentPayload): number {
  const source = payload.codeEdit.files["db_pool_config"] ?? "";
  const match = source.match(/pool_size\s*=\s*(\d+)/);
  if (!match) return 0;
  const value = Number(match[1]);
  if (value >= POOL_SIZE_TARGET_MIN) return 100;
  if (value > 12) return 50;
  return 0;
}

// Small additive bonus for genuinely multi-file reasoning: did the
// candidate also address the calling code (retry/backoff on pool
// exhaustion), not just the config value. Modest and capped so it adds
// breadth without dominating the primary pool_size check above - same
// "additive, not materially more rigorous" philosophy as every other
// keyword-based check in this file.
const RETRY_BACKOFF_PATTERN = /retry|backoff|re-?queue/i;
const ORDER_SERVICE_BONUS = 10;

function scoreOrderServiceEdit(payload: DebugIncidentPayload): number {
  const source = payload.codeEdit.files["order_service"] ?? "";
  return RETRY_BACKOFF_PATTERN.test(source) ? ORDER_SERVICE_BONUS : 0;
}

function scoreTAI(payload: DebugIncidentPayload): number {
  const text = `${payload.rootCause} ${payload.fix}`;
  if (!isLongEnough(payload.rootCause) || !isLongEnough(payload.fix)) return 0;
  const matched = TAI_CONCEPT_GROUPS.filter((re) => re.test(text)).length;
  const conceptScore = (matched / TAI_CONCEPT_GROUPS.length) * 100;
  const codeEditScore = scoreCodeEdit(payload);
  const base = Math.round(conceptScore * 0.6 + codeEditScore * 0.4);
  return clamp(base + scoreOrderServiceEdit(payload));
}

// Small additive bonus, same "additive breadth, not materially more
// rigorous" philosophy as the order-service bonus above: a query that
// merely contains the right keywords proves exactly as little as free
// text containing them, so this is capped modestly relative to the
// primary IS_EVIDENCE_TOKENS check on the written root cause.
const IS_QUERY_BONUS = 10;

function scoreQueryEvidence(events: InputEvent[]): number {
  const queries = events.filter(
    (e): e is Extract<InputEvent, { type: "query_run" }> => e.type === "query_run" && !e.errored
  );
  const matched = queries.some((q) => IS_EVIDENCE_TOKENS.some((re) => re.test(q.sql)));
  return matched ? IS_QUERY_BONUS : 0;
}

function scoreIS(payload: DebugIncidentPayload, events: InputEvent[]): number {
  if (!isLongEnough(payload.rootCause)) return 0;
  const matched = IS_EVIDENCE_TOKENS.filter((re) => re.test(payload.rootCause)).length;
  const base = Math.round((matched / 3) * 100); // 3+ specific tokens = full credit
  return clamp(base + scoreQueryEvidence(events));
}

// With real branching, reaching the final call always means the candidate
// received and had a chance to read the room's reaction to their first
// call - so "did they read the updates" (the old proxy) is now
// structurally guaranteed and no longer a useful signal. Instead this
// measures whether they paused to actually consider the reaction before
// locking in a final call, vs. re-clicking instantly - a lenient banded
// floor, not a race, consistent with this codebase's other timing checks
// (see lib/wse/ciq/timing.ts).
const MIN_CONSIDERATION_MS = 3_000;
const FULL_CREDIT_CONSIDERATION_MS = 15_000;

function scorePR(payload: DebugIncidentPayload): number {
  const considerationMs =
    payload.checkpoint2.msElapsedWhenChosen - payload.checkpoint1.msElapsedWhenChosen;
  if (considerationMs < MIN_CONSIDERATION_MS) return 30;
  if (considerationMs >= FULL_CREDIT_CONSIDERATION_MS) return 100;
  const ratio =
    (considerationMs - MIN_CONSIDERATION_MS) /
    (FULL_CREDIT_CONSIDERATION_MS - MIN_CONSIDERATION_MS);
  return clamp(Math.round(30 + ratio * 70));
}

function scoreLAM(payload: DebugIncidentPayload): number {
  const c1Good = GOOD_CHOICES.includes(payload.checkpoint1.choice);
  const c2Good = GOOD_CHOICES.includes(payload.checkpoint2.choice);
  const changed = payload.checkpoint2.changedFromCheckpoint1;

  if (c1Good && !changed) return 85; // well-calibrated from the start
  if (!c1Good && changed && c2Good) return 90; // correctly revised on new info
  if (!c1Good && !changed) return 20; // had a weak read and never adjusted
  if (c1Good && changed && !c2Good) return 10; // regressed despite more info
  return 40; // moved, but didn't land on a real fix
}

// Quiet time-allocation signal (PRD 7B.5 names this a legitimate DMCS
// input) - deliberately a bonus-only band, never a deduction. Being fast
// is already handled separately and non-punitively by CIQ's timing
// heuristic (lib/wse/ciq/timing.ts, "flag for review", not scored down);
// duplicating that as a scoring penalty here would double-punish the same
// signal. Reuses the same floor shape (base seconds + chars/typing-speed)
// as that CIQ check for consistency, but only ever adds up to 10 points
// for plausibly unhurried work - never surfaced to the candidate as a
// threat, per the PRD's explicit "no countdown/panic clock" requirement.
const SA_TIME_FLOOR_SECONDS = 30;
const SA_TIME_CHARS_PER_SECOND = 8;
const SA_TIME_FULL_CREDIT_MULTIPLIER = 1.5;
const SA_TIME_MAX_BONUS = 10;

function scoreTimeAllocation(
  payload: DebugIncidentPayload,
  durationSeconds: number | null
): number {
  if (durationSeconds == null) return 0;
  const textLength = (payload.rootCause + payload.fix + payload.validationPlan).length;
  const floor = SA_TIME_FLOOR_SECONDS + textLength / SA_TIME_CHARS_PER_SECOND;
  if (durationSeconds < floor) return 0;
  const fullCreditAt = floor * SA_TIME_FULL_CREDIT_MULTIPLIER;
  if (durationSeconds >= fullCreditAt) return SA_TIME_MAX_BONUS;
  const ratio = (durationSeconds - floor) / (fullCreditAt - floor);
  return Math.round(ratio * SA_TIME_MAX_BONUS);
}

function scoreSA(payload: DebugIncidentPayload, durationSeconds: number | null): number {
  let score = 50;
  if (isLongEnough(payload.validationPlan) && SA_RISK_KEYWORDS.test(payload.validationPlan)) {
    score += 30;
  }
  if (payload.checkpoint2.choice !== "keep_investigating") {
    score += 20; // this is a live SEV-2 with a climbing failure rate by the final checkpoint
  }
  score += scoreTimeAllocation(payload, durationSeconds);
  return clamp(score);
}

export function scoreDebugIncident(
  payload: DebugIncidentPayload,
  events: InputEvent[],
  meta?: { durationSeconds: number | null }
): DimensionScores {
  return {
    TAI: scoreTAI(payload),
    PR: scorePR(payload),
    IS: scoreIS(payload, events),
    SA: scoreSA(payload, meta?.durationSeconds ?? null),
    LAM: scoreLAM(payload),
  };
}
