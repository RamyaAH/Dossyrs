import type { Dimension, InputEvent } from "@/lib/wse/types";

// Generic, read-time-only reconstruction of "when did each dimension's
// contribution become knowable" from a session's real input_events. This
// is deliberately NOT a continuous/animated score curve: only final field
// values and a handful of timestamped structural events were ever
// captured (see hooks/useFieldInputTracking.ts - no incremental content
// snapshots), so a smoothly interpolating fill would be fabricated data.
// Discrete, honest reveals only.

export interface ReplayEventMapping {
  label: string;
  dimensions: Dimension[];
  matches(event: InputEvent): boolean;
}

export interface DimensionReveal {
  dimension: Dimension;
  revealedAt: number;
  contributingEvents: { label: string; t: number }[];
}

export function buildReplaySequence(
  events: InputEvent[],
  mappings: ReplayEventMapping[]
): DimensionReveal[] {
  const byDimension = new Map<Dimension, { label: string; t: number }[]>();

  for (const event of events) {
    for (const mapping of mappings) {
      if (!mapping.matches(event)) continue;
      for (const dimension of mapping.dimensions) {
        const list = byDimension.get(dimension) ?? [];
        list.push({ label: mapping.label, t: event.t });
        byDimension.set(dimension, list);
      }
    }
  }

  return [...byDimension.entries()]
    .map(([dimension, contributingEvents]) => {
      const sorted = [...contributingEvents].sort((a, b) => a.t - b.t);
      return {
        dimension,
        revealedAt: sorted[sorted.length - 1].t,
        contributingEvents: sorted,
      };
    })
    .sort((a, b) => a.revealedAt - b.revealedAt);
}
