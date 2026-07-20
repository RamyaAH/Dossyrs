import type { DimensionScores, InputEvent } from "@/lib/wse/types";
import type { SprintTriagePayload } from "./types";
import { SPRINT_TRIAGE_CAPACITY_DAYS, SPRINT_TRIAGE_TICKETS } from "./content";

const MIN_ANSWER_LENGTH = 15;

// Highest priority first. See content.ts for the reasoning: compliance risk
// (106), a hard externally-announced deadline (103), and an active
// revenue-impacting bug (101) are the three that matter most, and are
// deliberately sized to fit the 3-day capacity exactly.
const IDEAL_ORDER = ["106", "103", "101", "105", "108", "102", "104", "107"];
const IDEAL_KEEP_SET = new Set(["106", "101", "103"]);

const TOP_JUSTIFICATION_EVIDENCE_TOKENS: RegExp[] = [
  /compliance|legal|tax/i,
  /pricing|deadline|monday|launch/i,
  /checkout|safari|mobile/i,
];

const TECHNICAL_RISK_KEYWORDS: RegExp[] = [
  /rollback/i,
  /feature.?flag|staged?\s*rollout|gradual/i,
  /backward.?compat/i,
  /downtime|lock(ing)?|migration window/i,
  /staging|test(ed|ing)?\s*(env|environment)?/i,
];

const PUSHBACK_REASONING_KEYWORDS: RegExp[] = [
  /capacity|3\s*days?|engineer.?days?/i,
  /trade.?off|cut|defer|instead of/i,
  /compliance|legal|deadline|checkout/i, // references what's already committed
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function isLongEnough(text: string): boolean {
  return text.trim().length >= MIN_ANSWER_LENGTH;
}

function spearmanCorrelation(order: string[], ideal: string[]): number {
  const idealRank = new Map(ideal.map((id, i) => [id, i]));
  const n = order.length;
  if (n === 0) return 0;

  let sumSquaredDiff = 0;
  order.forEach((id, actualRank) => {
    const idealPos = idealRank.get(id);
    if (idealPos == null) return;
    const diff = actualRank - idealPos;
    sumSquaredDiff += diff * diff;
  });

  return 1 - (6 * sumSquaredDiff) / (n * (n * n - 1));
}

function scorePR(payload: SprintTriagePayload): number {
  const correlation = spearmanCorrelation(payload.finalOrder, IDEAL_ORDER);
  // correlation ranges [-1, 1]; map to [0, 100]
  return clamp(Math.round(((correlation + 1) / 2) * 100));
}

function scoreSA(payload: SprintTriagePayload): number {
  const effortById = new Map(SPRINT_TRIAGE_TICKETS.map((t) => [t.id, t.effortDays]));
  const totalKeptEffort = payload.keptTicketIds.reduce(
    (sum, id) => sum + (effortById.get(id) ?? 0),
    0
  );

  const fitsCapacity = totalKeptEffort <= SPRINT_TRIAGE_CAPACITY_DAYS + 0.01;
  const keptSet = new Set(payload.keptTicketIds);
  const idealOverlap =
    [...IDEAL_KEEP_SET].filter((id) => keptSet.has(id)).length / IDEAL_KEEP_SET.size;

  let score = 0;
  if (fitsCapacity) score += 50;
  score += Math.round(idealOverlap * 50);
  return clamp(score);
}

function scoreIS(payload: SprintTriagePayload): number {
  if (!isLongEnough(payload.topJustification)) return 0;
  const matched = TOP_JUSTIFICATION_EVIDENCE_TOKENS.filter((re) =>
    re.test(payload.topJustification)
  ).length;
  return clamp(Math.round((matched / TOP_JUSTIFICATION_EVIDENCE_TOKENS.length) * 100));
}

function scoreLAM(payload: SprintTriagePayload): number {
  if (!isLongEnough(payload.pushback.justification)) return 15; // engaged with the prompt but gave nothing real
  const matched = PUSHBACK_REASONING_KEYWORDS.filter((re) =>
    re.test(payload.pushback.justification)
  ).length;
  // Either holding firm or changing course is fine - what matters is
  // whether the reasoning actually engages with the capacity tradeoff.
  return clamp(Math.round((matched / PUSHBACK_REASONING_KEYWORDS.length) * 100));
}

function scoreTAI(payload: SprintTriagePayload): number {
  if (!isLongEnough(payload.technicalRiskAnswer)) return 0;
  const matched = TECHNICAL_RISK_KEYWORDS.filter((re) =>
    re.test(payload.technicalRiskAnswer)
  ).length;
  return clamp(Math.round((matched / 3) * 100)); // 3+ mitigation concepts = full credit
}

export function scoreSprintTriage(
  payload: SprintTriagePayload,
  _events: InputEvent[]
): DimensionScores {
  return {
    PR: scorePR(payload),
    SA: scoreSA(payload),
    IS: scoreIS(payload),
    LAM: scoreLAM(payload),
    TAI: scoreTAI(payload),
  };
}
