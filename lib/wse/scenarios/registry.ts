import type { ScenarioDefinition } from "@/lib/wse/types";
import { scoreDebugIncident } from "./debug-incident/score";
import { scoreSprintTriage } from "./sprint-triage/score";
import { scoreAmbiguousRequest } from "./ambiguous-request/score";

// Ordered list of fixed scenarios a candidate completes, in order. Populated
// as each scenario is built: debug-incident first, then sprint-triage, then
// ambiguous-request.
export const SCENARIO_REGISTRY: ScenarioDefinition[] = [
  {
    slug: "debug-incident",
    title: "OrderSync incident",
    version: "debug-incident-1.0",
    families: ["debugging_diagnosis", "pressure_time_constraints", "quality_risk_judgment"],
    dimensionWeights: { TAI: 1, PR: 1, IS: 1, SA: 1, LAM: 1 },
    score: scoreDebugIncident,
  },
  {
    slug: "sprint-triage",
    title: "Sprint triage",
    version: "sprint-triage-1.0",
    families: ["prioritization_tradeoffs", "planning_decomposition", "collaboration_alignment"],
    dimensionWeights: { TAI: 1, PR: 1, IS: 1, SA: 1, LAM: 1 },
    score: scoreSprintTriage,
  },
  {
    slug: "ambiguous-request",
    title: "Ambiguous request",
    version: "ambiguous-request-1.0",
    families: ["ambiguity_handling", "planning_decomposition"],
    dimensionWeights: { TAI: 1, PR: 1, IS: 1, SA: 1, LAM: 1 },
    score: scoreAmbiguousRequest,
  },
];

export function getScenarioDefinition(slug: string): ScenarioDefinition | undefined {
  return SCENARIO_REGISTRY.find((s) => s.slug === slug);
}
