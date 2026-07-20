export interface SprintTriagePayload {
  finalOrder: string[]; // ticket ids, candidate's final priority order (highest first)
  keptTicketIds: string[]; // tickets kept within the stated capacity constraint
  pushback: {
    action: "held" | "changed";
    justification: string;
  };
  topJustification: string; // why the top-ranked tickets are top-ranked
  technicalRiskAnswer: string;
}
