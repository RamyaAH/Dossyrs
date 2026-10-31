import type { ReplayEventMapping } from "@/lib/wse/scoring/replay";

export const SPRINT_TRIAGE_REPLAY_MAPPINGS: ReplayEventMapping[] = [
  {
    label: "Reordered backlog",
    dimensions: ["PR"],
    matches: (e) => e.type === "rank_change" && e.field === "ticketOrder",
  },
  {
    label: "Selected kept tickets",
    dimensions: ["SA"],
    matches: (e) => e.type === "select_change" && e.field === "keptTicketIds",
  },
  {
    label: "Wrote top-priority justification",
    dimensions: ["IS"],
    matches: (e) => e.type === "field_blur" && e.field === "topJustification",
  },
  {
    label: "Wrote technical risk answer",
    dimensions: ["TAI"],
    matches: (e) => e.type === "field_blur" && e.field === "technicalRiskAnswer",
  },
  {
    label: "Final pushback call locked in",
    dimensions: ["LAM"],
    matches: (e) => e.type === "persona_reply_chosen" && e.role === "final",
  },
];
