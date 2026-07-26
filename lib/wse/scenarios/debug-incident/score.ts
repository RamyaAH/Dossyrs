import type { DimensionScores, InputEvent } from "@/lib/wse/types";
import type { DebugActionChoice, DebugIncidentPayload } from "./types";

const TOTAL_CLICKABLE_UPDATES = 3; // DEBUG_INCIDENT_UPDATES.length - 1 (first one is auto-shown)
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
  const match = payload.codeEdit.finalSource.match(/pool_size\s*=\s*(\d+)/);
  if (!match) return 0;
  const value = Number(match[1]);
  if (value >= POOL_SIZE_TARGET_MIN) return 100;
  if (value > 12) return 50;
  return 0;
}

function scoreTAI(payload: DebugIncidentPayload): number {
  const text = `${payload.rootCause} ${payload.fix}`;
  if (!isLongEnough(payload.rootCause) || !isLongEnough(payload.fix)) return 0;
  const matched = TAI_CONCEPT_GROUPS.filter((re) => re.test(text)).length;
  const conceptScore = (matched / TAI_CONCEPT_GROUPS.length) * 100;
  const codeEditScore = scoreCodeEdit(payload);
  return clamp(Math.round(conceptScore * 0.6 + codeEditScore * 0.4));
}

function scoreIS(payload: DebugIncidentPayload): number {
  if (!isLongEnough(payload.rootCause)) return 0;
  const matched = IS_EVIDENCE_TOKENS.filter((re) => re.test(payload.rootCause)).length;
  return clamp(Math.round((matched / 3) * 100)); // 3+ specific tokens = full credit
}

function scorePR(payload: DebugIncidentPayload): number {
  const viewed = clamp(payload.checkpoint2.updatesViewedBefore, 0, TOTAL_CLICKABLE_UPDATES);
  return clamp(Math.round((viewed / TOTAL_CLICKABLE_UPDATES) * 100));
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

function scoreSA(payload: DebugIncidentPayload): number {
  let score = 50;
  if (isLongEnough(payload.validationPlan) && SA_RISK_KEYWORDS.test(payload.validationPlan)) {
    score += 30;
  }
  if (payload.checkpoint2.choice !== "keep_investigating") {
    score += 20; // this is a live SEV-2 with a climbing failure rate by the final checkpoint
  }
  return clamp(score);
}

export function scoreDebugIncident(
  payload: DebugIncidentPayload,
  _events: InputEvent[]
): DimensionScores {
  return {
    TAI: scoreTAI(payload),
    PR: scorePR(payload),
    IS: scoreIS(payload),
    SA: scoreSA(payload),
    LAM: scoreLAM(payload),
  };
}
