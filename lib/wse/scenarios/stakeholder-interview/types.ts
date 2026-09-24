export interface StakeholderInterviewTranscriptMessage {
  role: "candidate" | "persona";
  text: string;
}

export interface StakeholderInterviewPayload {
  transcript: StakeholderInterviewTranscriptMessage[];
  proposal: string;
}
