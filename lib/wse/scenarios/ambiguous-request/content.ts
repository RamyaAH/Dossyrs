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
