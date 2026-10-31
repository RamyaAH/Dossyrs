// Shared across every scenario with a persona feed (debug-incident,
// sprint-triage, ambiguous-request) - not scenario-specific despite these
// types originally living inside debug-incident's own content.ts.

export interface Persona {
  id: string;
  name: string;
  role: string;
  personality: string;
}

export interface PersonaMessage {
  personaId: string;
  text: string;
}
