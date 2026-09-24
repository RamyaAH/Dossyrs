// Client-safe content only — the persona's ground-truth facts and behavior
// instructions live in ./script.ts (server-only), never here.

export const STAKEHOLDER_INTERVIEW_BRIEFING = {
  title: "Stakeholder interview — Team Workspaces",
  summary:
    "Product wants a \"Team Workspaces\" feature so managers can group users together with shared settings. The ticket is thin. Before you propose anything, talk it through with Jordan, the PM who filed it — ask what you need to, then write up your plan.",
};

export interface StakeholderPersona {
  id: string;
  name: string;
  role: string;
  personality: string;
}

export const STAKEHOLDER_INTERVIEW_PERSONA: StakeholderPersona = {
  id: "pm",
  name: "Jordan",
  role: "Product Manager",
  personality: "Friendly, busy, answers directly but doesn't volunteer everything unprompted.",
};

export const STAKEHOLDER_INTERVIEW_OPENING_MESSAGE = {
  personaId: STAKEHOLDER_INTERVIEW_PERSONA.id,
  text: "Hey! So — Team Workspaces. Managers have been asking for a way to group their people together with shared settings instead of configuring everyone one by one. What do you want to know before you start?",
};

// Candidate messages beyond this are rejected server-side; the UI nudges
// toward wrapping up as the budget runs low.
export const STAKEHOLDER_INTERVIEW_TURN_BUDGET = 6;

export const STAKEHOLDER_INTERVIEW_PROPOSAL_FIELD = {
  label: "Write up your implementation plan",
  placeholder: "Based on the conversation, what would you actually build? List your approach.",
  minLength: 30,
};
