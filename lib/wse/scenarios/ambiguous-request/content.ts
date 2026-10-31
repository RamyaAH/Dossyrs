import type { Persona } from "../shared/persona";

export const AMBIGUOUS_REQUEST_PERSONAS: Persona[] = [
  {
    id: "pm",
    name: "Product",
    role: "Product Manager",
    personality: "Decisive, keeps scope tight for the MVP.",
  },
];

export const AMBIGUOUS_REQUEST_BRIEFING = {
  title: "Underspecified request — Favorites feature",
  summary:
    "Product wants a \"Favorites\" feature so signed-in users can save products they're interested in and see them later. This is web-only for now (no mobile app work needed). Ship an MVP version this sprint.",
};

export interface AmbiguousRequestQuestion {
  id: string;
  text: string;
  // Not shown to the candidate - used only for scoring.
  alreadyAnswered: boolean;
}

// 2 of these are already answered in the briefing above (signed-in only,
// web-only) - selecting them is a negative signal for reading
// comprehension, not a neutral one.
export const AMBIGUOUS_REQUEST_QUESTIONS: AmbiguousRequestQuestion[] = [
  {
    id: "q1",
    text: "Should this work for guest/anonymous users, or only signed-in accounts?",
    alreadyAnswered: true,
  },
  {
    id: "q2",
    text: "Do we need this to work on the mobile app as well as web?",
    alreadyAnswered: true,
  },
  {
    id: "q3",
    text: "Is there a limit on how many items a user can favorite?",
    alreadyAnswered: false,
  },
  {
    id: "q4",
    text: "Where in the UI should users be able to favorite an item — product card, detail page, or both?",
    alreadyAnswered: false,
  },
  {
    id: "q5",
    text: "Do we need a dedicated \"My Favorites\" page, or just a way to see favorited status inline?",
    alreadyAnswered: false,
  },
  {
    id: "q6",
    text: "Should favoriting an item trigger notifications, like a price-drop alert?",
    alreadyAnswered: false,
  },
  {
    id: "q7",
    text: "What should happen to a favorited item if it goes out of stock or gets discontinued?",
    alreadyAnswered: false,
  },
  {
    id: "q8",
    text: "Is there an existing wishlist feature this needs to integrate with or replace?",
    alreadyAnswered: false,
  },
];

// Real answers only for genuinely-new questions (q3-q8). Deliberately no
// entries for the decoy ids (q1/q2) - branch.ts falls back to a redirect
// message for any id not in this map, which is exactly what should happen
// for a question already answered in the briefing.
export const AMBIGUOUS_REQUEST_ANSWERS: Record<string, string> = {
  q3: "No hard limit for MVP — let's not build a cap unless we actually see abuse.",
  q4: "Both — product card for quick access, detail page for the full context. Keep it consistent across the two.",
  q5: "Yes, a dedicated \"My Favorites\" page — inline status alone isn't enough for someone to find what they saved later.",
  q6: "Not for MVP. Good V2 idea, but out of scope for this sprint.",
  q7: "Keep it in their list but show it clearly as unavailable — don't silently remove it.",
  q8: "No existing wishlist feature. This is net new, nothing to integrate with or replace.",
};
