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
    <div className="min-h-screen bg-surface-raised">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          {severityLabel && (
            <span className="band-pill bg-danger-bg text-danger">{severityLabel}</span>
          )}
          <h1 className="text-lg font-semibold text-ink">{title}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>{progressLabel}</span>
          <span className="tabular-nums">{elapsedFormatted}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
