// Portable, human-shareable Assessment ID, e.g. "DOS-2026-7F3K2Q". This is
// stored on wse_sessions.assessment_id (unique) and is what the public
// Prooffile link is keyed on — it must never be reused or reassigned once a
// session exists, which the unique DB constraint enforces.
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

export function generateAssessmentId(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return `DOS-${year}-${suffix}`;
}
