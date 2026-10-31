import type { ReplayEventMapping } from "@/lib/wse/scoring/replay";

export const AMBIGUOUS_REQUEST_REPLAY_MAPPINGS: ReplayEventMapping[] = [
  {
    label: "Selected clarifying questions",
    dimensions: ["IS"],
    matches: (e) => e.type === "select_change" && e.field === "selectedQuestionIds",
  },
  {
    label: "Wrote implementation plan",
    dimensions: ["SA", "PR", "TAI", "LAM"],
    matches: (e) => e.type === "field_blur" && e.field === "implementationPlan",
  },
];
