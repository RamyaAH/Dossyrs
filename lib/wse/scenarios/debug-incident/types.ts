export type DebugActionChoice =
  | "rollback"
  | "kill_switch"
  | "scale_pool"
  | "keep_investigating";

export interface DebugCheckpointAnswer {
  choice: DebugActionChoice;
  msElapsedWhenChosen: number; // server-computed ms since scenario start when this choice was locked in
}

export interface DebugIncidentPayload {
  checkpoint1: DebugCheckpointAnswer;
  checkpoint2: DebugCheckpointAnswer & { changedFromCheckpoint1: boolean };
  rootCause: string;
  fix: string;
  validationPlan: string;
  codeEdit: { files: Record<string, string> };
}
