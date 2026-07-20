export interface SprintTriageTicket {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  effortDays: number;
  context: string;
}

export const SPRINT_TRIAGE_BRIEFING = {
  title: "Sprint triage — 3 engineer-days before the deadline",
  summary:
    "Your team has 3 engineer-days left before this sprint's deadline. Review the backlog below, decide what to prioritize, and decide what to defer.",
};

export const SPRINT_TRIAGE_CAPACITY_DAYS = 3;

// Effort deliberately sums so the top-3 by priority (106, 103, 101) fits
// capacity exactly, and no other combination reaching similar priority
// coverage does - this is what makes the capacity tradeoff meaningful
// rather than arbitrary.
export const SPRINT_TRIAGE_TICKETS: SprintTriageTicket[] = [
  {
    id: "106",
    title: "Fix incorrect tax calculation for EU customers",
    severity: "high",
    effortDays: 0.5,
    context: "Legal flagged this as a compliance risk for EU invoicing.",
  },
  {
    id: "101",
    title: "Fix checkout button unresponsive on Safari mobile",
    severity: "high",
    effortDays: 1,
    context:
      "Support has logged 12 tickets this week from mobile Safari users unable to complete checkout.",
  },
  {
    id: "103",
    title: "Database migration for new pricing tiers",
    severity: "high",
    effortDays: 1.5,
    context: "Sales has already announced the new pricing tiers to prospects for next Monday.",
  },
  {
    id: "105",
    title: "Rate-limit the public API to prevent abuse",
    severity: "medium",
    effortDays: 1,
    context: "One partner integration briefly overloaded the API last week - no outage yet.",
  },
  {
    id: "108",
    title: "Add dark mode to the settings page",
    severity: "low",
    effortDays: 2,
    context: "Frequently requested in user feedback surveys; no particular urgency.",
  },
  {
    id: "102",
    title: "Add CSV export to admin reports",
    severity: "low",
    effortDays: 2,
    context: "One non-enterprise customer requested this as a nice-to-have.",
  },
  {
    id: "104",
    title: "Refactor the legacy auth module",
    severity: "low",
    effortDays: 3,
    context: "Long-standing tech debt; no immediate customer impact.",
  },
  {
    id: "107",
    title: "Refresh onboarding email copy",
    severity: "low",
    effortDays: 0.5,
    context: "Marketing wants the copy refreshed before next campaign; not time-critical.",
  },
];

export const SPRINT_TRIAGE_PUSHBACK_MESSAGE = {
  from: "Sales",
  text: "Can we bump the CSV export ticket (102)? A prospect said they need it to close a deal this week.",
};

export const SPRINT_TRIAGE_TECHNICAL_RISK_PROMPT =
  "TICKET-103 involves a database migration for the new pricing tiers, shipping right before Monday's announced launch. What's the technical risk of shipping this migration under that timeline, and how would you mitigate it?";
