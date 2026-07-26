// Prooffile Block 6 — candidate-provided context, always below the
// verified blocks, explicitly labeled unverified per the PRD. Only renders
// if the candidate actually provided at least one link at signup.
export function ResumeLinks({
  resumeUrl,
  portfolioUrl,
}: {
  resumeUrl: string | null;
  portfolioUrl: string | null;
}) {
  if (!resumeUrl && !portfolioUrl) return null;

  return (
    <div className="card flex flex-col gap-3">
      <span className="label-mono">Candidate-provided context</span>
      <p className="text-xs text-muted">
        Not verified by Dossyr. Not used in matching or ranking.
      </p>
      <div className="flex flex-col gap-2">
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand hover:underline"
          >
            Resume / CV →
          </a>
        )}
        {portfolioUrl && (
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand hover:underline"
          >
            Portfolio / Project →
          </a>
        )}
      </div>
    </div>
  );
}
