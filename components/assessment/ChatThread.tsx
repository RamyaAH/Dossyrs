"use client";

export function ChatThread({
  messages,
  revealedCount,
  hasMore,
  onRequestNext,
}: {
  messages: { from: string; text: string }[];
  revealedCount: number;
  hasMore: boolean;
  onRequestNext: () => void;
}) {
  const visible = messages.slice(0, revealedCount);

  return (
    <div className="card flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-ink">Incident thread</h2>
      <div className="flex flex-col gap-2.5">
        {visible.map((m, i) => (
          <div key={i} className="rounded-md border border-border bg-surface-raised p-3">
            <div className="mb-1 text-xs font-semibold text-muted">{m.from}</div>
            <p className="text-sm text-ink">{m.text}</p>
          </div>
        ))}
      </div>
      {hasMore && (
        <button type="button" onClick={onRequestNext} className="btn-secondary self-start">
          Get next update
        </button>
      )}
    </div>
  );
}
