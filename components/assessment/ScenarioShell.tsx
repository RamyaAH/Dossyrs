"use client";

export function ScenarioShell({
  title,
  severityLabel,
  progressLabel,
  elapsedFormatted,
  children,
}: {
  title: string;
  severityLabel?: string;
  progressLabel: string;
  elapsedFormatted: string;
  children: React.ReactNode;
}) {
  return (
    <div className="workspace-theme min-h-screen bg-surface-raised">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="label-mono flex items-center gap-1 text-muted">
            Dossyr
            <span className="dot bg-brand" />
          </span>
          {severityLabel && (
            <span className="band-pill bg-danger-bg text-danger">
              <span className="dot bg-current" />
              {severityLabel}
            </span>
          )}
          <h1 className="text-lg text-ink">{title}</h1>
        </div>
        <div className="label-mono flex items-center gap-4">
          <span>{progressLabel}</span>
          <span className="tabular-nums">{elapsedFormatted}</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
