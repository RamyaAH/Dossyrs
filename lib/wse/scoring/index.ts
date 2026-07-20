import { getScenarioDefinition } from "@/lib/wse/scenarios/registry";
import { scoreToBand } from "./bands";
import type { Dimension, InputEvent } from "@/lib/wse/types";

export interface ScenarioResponseRow {
  scenario_slug: string;
  scenario_version: string;
  response_payload: unknown;
  input_events: unknown;
}

export interface DmcsScoreRow {
  dimension: Dimension;
  raw_score: number;
  band: string;
  contributing_scenarios: string[];
}

const ALL_DIMENSIONS: Dimension[] = ["TAI", "PR", "IS", "SA", "LAM"];

interface DimensionAccumulator {
  weightedSum: number;
  totalWeight: number;
  contributingScenarios: string[];
}

// Server-side only - never trust client-computed scores. Dispatches each
// scenario's response to its own deterministic score() function, then
// aggregates into a single weighted-average band per dimension.
export function computeDmcsScores(responses: ScenarioResponseRow[]): DmcsScoreRow[] {
  const accumulators: Record<Dimension, DimensionAccumulator> = {
    TAI: { weightedSum: 0, totalWeight: 0, contributingScenarios: [] },
    PR: { weightedSum: 0, totalWeight: 0, contributingScenarios: [] },
    IS: { weightedSum: 0, totalWeight: 0, contributingScenarios: [] },
    SA: { weightedSum: 0, totalWeight: 0, contributingScenarios: [] },
    LAM: { weightedSum: 0, totalWeight: 0, contributingScenarios: [] },
  };

  for (const response of responses) {
    const definition = getScenarioDefinition(response.scenario_slug);
    if (!definition) continue; // defensive: shouldn't happen for a completed session

    const events = Array.isArray(response.input_events)
      ? (response.input_events as InputEvent[])
      : [];
    const scores = definition.score(response.response_payload, events);

    for (const dim of ALL_DIMENSIONS) {
      const weight = definition.dimensionWeights[dim];
      const value = scores[dim];
      if (weight == null || value == null) continue;

      const acc = accumulators[dim];
      acc.weightedSum += value * weight;
      acc.totalWeight += weight;
      acc.contributingScenarios.push(response.scenario_slug);
    }
  }

  return ALL_DIMENSIONS.filter((dim) => accumulators[dim].totalWeight > 0).map((dim) => {
    const acc = accumulators[dim];
    const rawScore = acc.weightedSum / acc.totalWeight;
    return {
      dimension: dim,
      raw_score: Math.round(rawScore * 100) / 100,
      band: scoreToBand(rawScore),
      contributing_scenarios: acc.contributingScenarios,
    };
  });
}
