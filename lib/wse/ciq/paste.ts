import type { InputEvent } from "@/lib/wse/types";

const PASTE_RATIO_THRESHOLD = 0.6;
const SINGLE_PASTE_CHAR_THRESHOLD = 150;

export interface PasteCheckInput {
  scenarioSlug: string;
  events: InputEvent[];
}

export interface PasteAnomalyResult {
  detected: boolean;
  detail: Record<string, unknown> | null;
}

export function detectPasteAnomaly(responses: PasteCheckInput[]): PasteAnomalyResult {
  for (const r of responses) {
    const pastedByField = new Map<string, number>();
    const finalCountByField = new Map<string, number>();

    for (const event of r.events) {
      if (event.type === "paste") {
        pastedByField.set(event.field, (pastedByField.get(event.field) ?? 0) + event.charsPasted);
        if (event.charsPasted > SINGLE_PASTE_CHAR_THRESHOLD) {
          return {
            detected: true,
            detail: {
              reason: "large_single_paste",
              scenarioSlug: r.scenarioSlug,
              field: event.field,
              charsPasted: event.charsPasted,
            },
          };
        }
      }
      if (event.type === "field_blur") {
        finalCountByField.set(event.field, event.charCountFinal);
      }
    }

    for (const [field, pasted] of pastedByField) {
      const finalCount = finalCountByField.get(field) ?? pasted;
      const ratio = finalCount === 0 ? 0 : pasted / finalCount;
      if (ratio > PASTE_RATIO_THRESHOLD) {
        return {
          detected: true,
          detail: {
            reason: "high_paste_ratio",
            scenarioSlug: r.scenarioSlug,
            field,
            ratio: Math.round(ratio * 100) / 100,
          },
        };
      }
    }
  }

  return { detected: false, detail: null };
}
