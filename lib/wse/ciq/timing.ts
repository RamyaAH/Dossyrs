import { extractStrings } from "./textUtils";

// Cheap, honest heuristics - not ML. Thresholds are generous on purpose to
// avoid flagging genuinely fast-but-real candidates; the goal is to catch
// sessions that are implausibly fast given how much was written, not to
// penalize speed itself.
const ABSOLUTE_SESSION_FLOOR_SECONDS = 240;
const EVIDENCE_READING_FLOOR_SECONDS = 30;
const FAST_TYPING_CHARS_PER_SECOND = 8;

export interface TimingCheckInput {
  scenarioSlug: string;
  durationSeconds: number | null;
  responsePayload: unknown;
}

export interface TimingAnomalyResult {
  detected: boolean;
  detail: Record<string, unknown> | null;
}

export function detectTimingAnomaly(
  totalSessionDurationSeconds: number,
  responses: TimingCheckInput[]
): TimingAnomalyResult {
  if (totalSessionDurationSeconds < ABSOLUTE_SESSION_FLOOR_SECONDS) {
    return {
      detected: true,
      detail: { reason: "total_session_too_fast", totalSessionDurationSeconds },
    };
  }

  for (const r of responses) {
    if (r.durationSeconds == null) continue;
    const totalChars = extractStrings(r.responsePayload).join("").length;
    const floor = EVIDENCE_READING_FLOOR_SECONDS + totalChars / FAST_TYPING_CHARS_PER_SECOND;
    if (r.durationSeconds < floor) {
      return {
        detected: true,
        detail: {
          reason: "scenario_too_fast",
          scenarioSlug: r.scenarioSlug,
          durationSeconds: r.durationSeconds,
          floor: Math.round(floor),
        },
      };
    }
  }

  return { detected: false, detail: null };
}
