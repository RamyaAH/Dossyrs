import { extractStrings, jaccardSimilarity } from "./textUtils";

const SIMILARITY_THRESHOLD = 0.7;
const MIN_TEXT_LENGTH_TO_COMPARE = 30; // skip short strings like action choices

export interface DuplicateCheckInput {
  scenarioSlug: string;
  responsePayload: unknown;
}

export interface DuplicateAnomalyResult {
  detected: boolean;
  detail: Record<string, unknown> | null;
}

// Flags near-identical free-text answers across DIFFERENT scenarios - e.g.
// scenario A's root-cause write-up and scenario B's justification being
// suspiciously similar, which shouldn't happen for genuinely independent
// scenarios. Word-trigram Jaccard similarity, no ML dependency.
export function detectDuplicateAnswers(responses: DuplicateCheckInput[]): DuplicateAnomalyResult {
  const textsByScenario = responses.map((r) => ({
    scenarioSlug: r.scenarioSlug,
    texts: extractStrings(r.responsePayload, MIN_TEXT_LENGTH_TO_COMPARE),
  }));

  for (let i = 0; i < textsByScenario.length; i++) {
    for (let j = i + 1; j < textsByScenario.length; j++) {
      if (textsByScenario[i].scenarioSlug === textsByScenario[j].scenarioSlug) continue;

      for (const textA of textsByScenario[i].texts) {
        for (const textB of textsByScenario[j].texts) {
          const similarity = jaccardSimilarity(textA, textB);
          if (similarity >= SIMILARITY_THRESHOLD) {
            return {
              detected: true,
              detail: {
                scenarioA: textsByScenario[i].scenarioSlug,
                scenarioB: textsByScenario[j].scenarioSlug,
                similarity: Math.round(similarity * 100) / 100,
              },
            };
          }
        }
      }
    }
  }

  return { detected: false, detail: null };
}
