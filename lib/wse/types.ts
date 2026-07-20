// Shared types for the WSE (Workplace Simulation Engine) assessment flow.
// Scenario-specific payload shapes live in each scenario's own types.ts and
// get folded into ScenarioResponsePayload below as each scenario is built.

export type Dimension = "TAI" | "PR" | "IS" | "SA" | "LAM";

export type Band = "Developing" | "Solid" | "Strong";

export type CiqStatus = "clean" | "review";

export type ScenarioFamily =
  | "debugging_diagnosis"
  | "prioritization_tradeoffs"
  | "ambiguity_handling"
  | "planning_decomposition"
  | "collaboration_alignment"
  | "quality_risk_judgment"
  | "pressure_time_constraints";

export type ScenarioSlug = "debug-incident" | "sprint-triage" | "ambiguous-request";

export const SCENARIO_SLUGS: ScenarioSlug[] = [
  "debug-incident",
  "sprint-triage",
  "ambiguous-request",
];

// Client-captured event log, flushed into wse_scenario_responses.input_events
// at submit time. Paste events carry metadata only (field/length/timestamp),
// never clipboard content — the final answer text is already captured in
// response_payload, which is all duplicate-detection needs.
export type InputEvent =
  | { type: "paste"; field: string; charsPasted: number; t: number }
  | { type: "field_blur"; field: string; charCountFinal: number; t: number }
  | { type: "action_choice"; field: string; value: string; t: number }
  | { type: "next_update_requested"; updateIndex: number; t: number }
  | { type: "rank_change"; field: string; order: string[]; t: number }
  | { type: "select_change"; field: string; values: string[]; t: number };

export type DimensionWeights = Partial<Record<Dimension, number>>;

export type DimensionScores = Partial<Record<Dimension, number>>;

export interface ScenarioDefinition<TPayload = unknown> {
  slug: ScenarioSlug;
  title: string;
  version: string;
  families: ScenarioFamily[];
  dimensionWeights: DimensionWeights;
  // Method shorthand (not an arrow-typed property) so scenario-specific
  // definitions - each typed to their own payload - remain assignable into
  // a single ScenarioDefinition[] registry array via TS's bivariant method
  // parameter checking. Callers still get full type safety within each
  // scenario's own score.ts.
  score(payload: TPayload, events: InputEvent[]): DimensionScores;
}

export const SCENARIO_FAMILY_LABELS: Record<ScenarioFamily, string> = {
  debugging_diagnosis: "Debugging and diagnosis",
  prioritization_tradeoffs: "Prioritization and tradeoffs",
  ambiguity_handling: "Ambiguity handling and clarification",
  planning_decomposition: "Planning and decomposition",
  collaboration_alignment: "Collaboration and alignment",
  quality_risk_judgment: "Quality, reliability, and risk judgment",
  pressure_time_constraints: "Pressure and time constraints",
};

export const DIMENSION_LABELS: Record<Dimension, string> = {
  TAI: "Technical Ability Index",
  PR: "Problem Resolution",
  IS: "Information Synthesis",
  SA: "Situational Awareness",
  LAM: "Learning and Adaptation Mindset",
};

// Only one fixed tier exists in this phase (no tier-selection screen), but
// keyed by the wse_sessions.tier value so this doesn't need touching if a
// real tier system is added later.
export const TIER_LABELS: Record<string, string> = {
  tier2_fixed: "Tier 2 — Role-Ready",
};

export function tierLabel(tier: string): string {
  return TIER_LABELS[tier] ?? tier;
}

export const DOMAIN_LABELS: Record<string, string> = {
  software_engineering: "Software Engineering",
};

export function domainLabel(domain: string): string {
  return DOMAIN_LABELS[domain] ?? domain;
}
