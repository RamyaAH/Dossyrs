import type { ReplayEventMapping } from "@/lib/wse/scoring/replay";

// Mirrors score.ts's actual dependencies exactly - PR/LAM/SA all finalize
// at checkpoint2 (checkpoint1 alone is only ever read relative to
// checkpoint2 in score.ts, so it isn't attributed a dimension here to
// avoid overclaiming what became "knowable" at that point).
export const DEBUG_INCIDENT_REPLAY_MAPPINGS: ReplayEventMapping[] = [
  {
    label: "Final action locked in",
    dimensions: ["PR", "LAM", "SA"],
    matches: (e) => e.type === "action_choice" && e.field === "checkpoint2",
  },
  {
    label: "Wrote root cause",
    dimensions: ["TAI", "IS"],
    matches: (e) => e.type === "field_blur" && e.field === "rootCause",
  },
  {
    label: "Wrote fix",
    dimensions: ["TAI"],
    matches: (e) => e.type === "field_blur" && e.field === "fix",
  },
  {
    label: "Edited config/db_pool_config.py",
    dimensions: ["TAI"],
    matches: (e) => e.type === "field_blur" && e.field === "codeEditor",
  },
  {
    label: "Wrote validation plan",
    dimensions: ["SA"],
    matches: (e) => e.type === "field_blur" && e.field === "validationPlan",
  },
];
