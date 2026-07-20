// Shared, scenario-agnostic text helpers for the CIQ heuristics. Walking the
// payload generically (rather than per-scenario field lists) means paste
// detection and duplicate detection don't need updating every time a new
// scenario is added.

export function extractStrings(value: unknown, minLength = 0, acc: string[] = []): string[] {
  if (typeof value === "string") {
    if (value.trim().length >= minLength) acc.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => extractStrings(v, minLength, acc));
  } else if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((v) =>
      extractStrings(v, minLength, acc)
    );
  }
  return acc;
}

function wordTrigrams(text: string): Set<string> {
  const words = text.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const trigrams = new Set<string>();
  for (let i = 0; i + 2 < words.length; i++) {
    trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return trigrams;
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = wordTrigrams(a);
  const setB = wordTrigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
