import type { CiqStatus, InputEvent } from "@/lib/wse/types";
import { detectTimingAnomaly } from "./timing";
import { detectPasteAnomaly } from "./paste";
import { detectDuplicateAnswers } from "./duplicate";

export interface ComputeCiqInput {
  totalSessionDurationSeconds: number;
  responses: {
    scenarioSlug: string;
    durationSeconds: number | null;
    responsePayload: unknown;
    events: InputEvent[];
  }[];
}

export interface CiqComputationResult {
  status: CiqStatus;
  timingAnomaly: boolean;
  timingDetail: Record<string, unknown> | null;
  pasteDetected: boolean;
  pasteDetail: Record<string, unknown> | null;
  duplicateAnswerDetected: boolean;
  duplicateDetail: Record<string, unknown> | null;
}

export function computeCiqSignals(input: ComputeCiqInput): CiqComputationResult {
  const timing = detectTimingAnomaly(input.totalSessionDurationSeconds, input.responses);
  const paste = detectPasteAnomaly(input.responses);
  const duplicate = detectDuplicateAnswers(input.responses);

  const status: CiqStatus =
    timing.detected || paste.detected || duplicate.detected ? "review" : "clean";

  return {
    status,
    timingAnomaly: timing.detected,
    timingDetail: timing.detail,
    pasteDetected: paste.detected,
    pasteDetail: paste.detail,
    duplicateAnswerDetected: duplicate.detected,
    duplicateDetail: duplicate.detail,
  };
}
