import type { ScenarioSlug } from "@/lib/wse/types";
import type { ReplayEventMapping } from "./replay";
import { DEBUG_INCIDENT_REPLAY_MAPPINGS } from "@/lib/wse/scenarios/debug-incident/replay";
import { SPRINT_TRIAGE_REPLAY_MAPPINGS } from "@/lib/wse/scenarios/sprint-triage/replay";
import { AMBIGUOUS_REQUEST_REPLAY_MAPPINGS } from "@/lib/wse/scenarios/ambiguous-request/replay";

// Deliberately separate from lib/wse/scenarios/registry.ts: that registry
// is scoring-dispatch-critical, this is a display-only concern for the
// employer replay view. Keeping them apart makes "skip scenarios without
// replay mappings" a trivial `in` check rather than widening
// ScenarioDefinition's contract for something scoring never needs.
export const REPLAY_MAPPINGS_BY_SLUG: Partial<Record<ScenarioSlug, ReplayEventMapping[]>> = {
  "debug-incident": DEBUG_INCIDENT_REPLAY_MAPPINGS,
  "sprint-triage": SPRINT_TRIAGE_REPLAY_MAPPINGS,
  "ambiguous-request": AMBIGUOUS_REQUEST_REPLAY_MAPPINGS,
};
