import type { DimensionScores, InputEvent } from "@/lib/wse/types";
import type { StakeholderInterviewPayload } from "./types";

const MIN_PROPOSAL_LENGTH = 30;

// One topic per candidate question this scenario is actually built to
// reward asking about (see ./script.ts's GROUND_TRUTH) - IS is scored on
// how many of these the candidate's own chat messages ever raised.
const IS_TOPIC_KEYWORDS: RegExp[] = [
  /multiple workspace|more than one workspace|two workspaces|belong to (more|several)/i, // multi-membership
  /permission|role|admin|member\b/i, // roles
  /size limit|how many (people|users|members)|max(imum)?/i, // capacity
  /timeline|deadline|when|this quarter/i, // timeline
  /billing|invoic/i, // the billing "Teams" collision
];

const SA_MULTI_WORKSPACE_PATTERN = /multiple workspace|more than one workspace|two workspaces|belong to (more|several)/i;
const PR_STRUCTURE_PATTERN = /phase|mvp|first|then|later|follow.?up/i;
const TAI_CONCRETENESS_KEYWORDS: RegExp[] = [
  /schema|data model|table|database/i,
  /api|endpoint/i,
  /permission|role|rbac/i,
  /migration|backfill/i,
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function isLongEnough(text: string, minLength = MIN_PROPOSAL_LENGTH): boolean {
  return text.trim().length >= minLength;
}

function countBulletLikeLines(text: string): number {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

function candidateMessages(payload: StakeholderInterviewPayload): string[] {
  return payload.transcript.filter((m) => m.role === "candidate").map((m) => m.text);
}

// How many distinct scenario topics the candidate ever raised across the
// whole conversation, not just the final proposal.
function scoreIS(payload: StakeholderInterviewPayload): number {
  const allCandidateText = candidateMessages(payload).join("\n");
  const matched = IS_TOPIC_KEYWORDS.filter((re) => re.test(allCandidateText)).length;
  return clamp(Math.round((matched / IS_TOPIC_KEYWORDS.length) * 100));
}

// Did the final plan actually account for the multi-workspace-membership
// complication Jordan may have raised?
function scoreSA(payload: StakeholderInterviewPayload): number {
  if (!isLongEnough(payload.proposal)) return 0;
  return SA_MULTI_WORKSPACE_PATTERN.test(payload.proposal) ? 100 : 30;
}

function scorePR(payload: StakeholderInterviewPayload): number {
  if (!isLongEnough(payload.proposal)) return 0;
  const lines = countBulletLikeLines(payload.proposal);
  let score = clamp(Math.round((Math.min(lines, 4) / 4) * 70));
  if (PR_STRUCTURE_PATTERN.test(payload.proposal)) score += 30;
  return clamp(score);
}

function scoreTAI(payload: StakeholderInterviewPayload): number {
  if (!isLongEnough(payload.proposal)) return 0;
  const matched = TAI_CONCRETENESS_KEYWORDS.filter((re) => re.test(payload.proposal)).length;
  return clamp(Math.round((matched / 3) * 100)); // 3+ concrete concepts = full credit
}

// Rewards continuing to engage after Jordan's pushback rather than
// stopping cold - at least one more substantive candidate message exists
// after the conversation's midpoint.
function scoreLAM(payload: StakeholderInterviewPayload): number {
  const messages = candidateMessages(payload);
  if (messages.length < 2) return messages.length === 1 ? 15 : 0;
  const lastMessage = messages[messages.length - 1];
  return isLongEnough(lastMessage, 15) ? 100 : 40;
}

export function scoreStakeholderInterview(
  payload: StakeholderInterviewPayload,
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
