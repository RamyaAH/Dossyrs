import type { Band } from "@/lib/wse/types";

// Our own calibration, since this is a new deterministic scoring system, not
// the PRD's undocumented ML model. Revisited only via a rubric_version bump
// on lib/wse/scoring/index.ts — never applied retroactively to already
// computed dmcs_scores rows (those are append-only, see migration 0004).
export const BAND_THRESHOLDS = {
  strongMin: 75,
  solidMin: 40,
} as const;

export function scoreToBand(rawScore: number): Band {
  if (rawScore >= BAND_THRESHOLDS.strongMin) return "Strong";
  if (rawScore >= BAND_THRESHOLDS.solidMin) return "Solid";
  return "Developing";
}
