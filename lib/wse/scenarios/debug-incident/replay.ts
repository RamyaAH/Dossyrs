import type { ReplayEventMapping } from "@/lib/wse/scoring/replay";

// Mirrors score.ts's actual dependencies exactly - PR/LAM/SA all finalize
// at checkpoint2 (checkpoint1 alone is only ever read relative to
// checkpoint2 in score.ts, so it isn't attributed a dimension here to
// avoid overclaiming what became "knowable" at that point).
export const DEBUG_INCIDENT_REPLAY_MAPPINGS: ReplayEventMapping[] = [
  {
    label: "Final action locked in",
    dimensions: ["PR", "LAM", "SA"],
    matches: (e) => e.type === "persona_reply_chosen" && e.role === "final",
  },
  {
    label: "Escalation appeared unprompted",
    dimensions: ["SA"],
    matches: (e) => e.type === "ambient_escalation_shown",
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
    label: "Edited code",
    dimensions: ["TAI"],
    matches: (e) => e.type === "field_blur" && e.field.startsWith("codeEditor"),
  },
  {
    label: "Committed changes",
    dimensions: ["IS", "LAM"],
    matches: (e) => e.type === "vcs_action" && e.action === "commit",
  },
  {
    label: "Queried the orders table",
    dimensions: ["IS"],
    matches: (e) => e.type === "query_run" && !e.errored,
  },
  {
    label: "Wrote validation plan",
    dimensions: ["SA"],
    matches: (e) => e.type === "field_blur" && e.field === "validationPlan",
  },
];
