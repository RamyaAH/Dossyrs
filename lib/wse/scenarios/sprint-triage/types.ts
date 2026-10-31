export interface SprintTriagePayload {
  finalOrder: string[]; // ticket ids, candidate's final priority order (highest first)
  keptTicketIds: string[]; // tickets kept within the stated capacity constraint
  pushback: {
    action: "held" | "changed"; // interim checkpoint - unchanged meaning, still what scoreLAM's keyword check reads
    justification: string;
    finalAction: "held" | "changed"; // final checkpoint, after seeing the room's reaction
    changedFromInitial: boolean;
    msElapsedWhenInitial: number;
    msElapsedWhenFinal: number;
  };
  topJustification: string; // why the top-ranked tickets are top-ranked
  technicalRiskAnswer: string;
}
