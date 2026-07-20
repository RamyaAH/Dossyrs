import type { DimensionScores, InputEvent } from "@/lib/wse/types";
import type { AmbiguousRequestPayload } from "./types";
import { AMBIGUOUS_REQUEST_QUESTIONS } from "./content";

const MIN_ANSWER_LENGTH = 15;
const MIN_CUSTOM_QUESTION_LENGTH = 10;

const GOOD_QUESTION_IDS = new Set(
  AMBIGUOUS_REQUEST_QUESTIONS.filter((q) => !q.alreadyAnswered).map((q) => q.id)
);
const BAD_QUESTION_IDS = new Set(
  AMBIGUOUS_REQUEST_QUESTIONS.filter((q) => q.alreadyAnswered).map((q) => q.id)
);

const SA_RISK_KEYWORDS: RegExp[] = [
  /out of stock|discontinued/i,
  /limit|cap\b/i,
  /error|fail(ure)?|edge case/i,
  /scale|performance/i,
];

const PR_STRUCTURE_KEYWORDS = /test|qa\b|validate|verify/i;

const TAI_CONCRETENESS_KEYWORDS: RegExp[] = [
  /api|endpoint/i,
  /database|schema|table|index/i,
  /cache|caching/i,
  /frontend|backend|component/i,
];

const LAM_CONTINGENCY_PATTERN = /\bif\b|in case|depending on|should .* occur/gi;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function isLongEnough(text: string, minLength = MIN_ANSWER_LENGTH): boolean {
  return text.trim().length >= minLength;
}

function countBulletLikeLines(text: string): number {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

function scoreIS(payload: AmbiguousRequestPayload): number {
  const selected = new Set(payload.selectedQuestionIds);
  const goodSelected = [...selected].filter((id) => GOOD_QUESTION_IDS.has(id)).length;
  const badSelected = [...selected].filter((id) => BAD_QUESTION_IDS.has(id)).length;

  let score = Math.round((goodSelected / GOOD_QUESTION_IDS.size) * 70);
  score -= badSelected * 25;
  if (isLongEnough(payload.customQuestion, MIN_CUSTOM_QUESTION_LENGTH)) {
    score += 15;
  }
  return clamp(score);
}

function scoreSA(payload: AmbiguousRequestPayload): number {
  if (!isLongEnough(payload.implementationPlan)) return 0;
  const matched = SA_RISK_KEYWORDS.filter((re) => re.test(payload.implementationPlan)).length;
  return clamp(Math.round((matched / SA_RISK_KEYWORDS.length) * 100));
}

function scorePR(payload: AmbiguousRequestPayload): number {
  if (!isLongEnough(payload.implementationPlan)) return 0;
  const lines = countBulletLikeLines(payload.implementationPlan);
  const hasValidationStep = PR_STRUCTURE_KEYWORDS.test(payload.implementationPlan);

  let score = clamp(Math.round((Math.min(lines, 5) / 5) * 70));
  if (hasValidationStep) score += 30;
  return clamp(score);
}

function scoreTAI(payload: AmbiguousRequestPayload): number {
  if (!isLongEnough(payload.implementationPlan)) return 0;
  const matched = TAI_CONCRETENESS_KEYWORDS.filter((re) =>
    re.test(payload.implementationPlan)
  ).length;
  return clamp(Math.round((matched / 3) * 100)); // 3+ concrete concepts = full credit
}

function scoreLAM(payload: AmbiguousRequestPayload): number {
  if (!isLongEnough(payload.implementationPlan)) return 0;
  const matches = payload.implementationPlan.match(LAM_CONTINGENCY_PATTERN) ?? [];
  return clamp(Math.round((Math.min(matches.length, 3) / 3) * 100));
}

export function scoreAmbiguousRequest(
  payload: AmbiguousRequestPayload,
  _events: InputEvent[]
): DimensionScores {
  return {
    IS: scoreIS(payload),
    SA: scoreSA(payload),
    PR: scorePR(payload),
    TAI: scoreTAI(payload),
    LAM: scoreLAM(payload),
  };
}
