"use client";

import type { SprintTriageTicket } from "@/lib/wse/scenarios/sprint-triage/content";

const SEVERITY_CLASS: Record<SprintTriageTicket["severity"], string> = {
  high: "bg-danger-bg text-danger",
  medium: "bg-warn-bg text-warn",
  low: "bg-surface-raised text-muted",
};

export function RankableList({
  tickets,
  order,
  keptIds,
  onReorder,
  onToggleKeep,
}: {
  tickets: SprintTriageTicket[];
  order: string[];
  keptIds: Set<string>;
  onReorder: (newOrder: string[]) => void;
  onToggleKeep: (id: string) => void;
}) {
  const byId = new Map(tickets.map((t) => [t.id, t]));

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...order];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onReorder(next);
  }

  function moveDown(index: number) {
    if (index === order.length - 1) return;
    const next = [...order];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onReorder(next);
  }

  return (
    <ul className="flex flex-col gap-2">
      {order.map((id, index) => {
        const ticket = byId.get(id);
        if (!ticket) return null;
        return (
          <li key={id} className="flex items-start gap-3 rounded-md border border-border p-3">
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-xs leading-none text-muted hover:text-ink disabled:opacity-30"
                aria-label="Move up"
              >
                ▲
              </button>
              <span className="text-xs text-muted">{index + 1}</span>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === order.length - 1}
                className="text-xs leading-none text-muted hover:text-ink disabled:opacity-30"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink">{ticket.title}</span>
                <span className={`band-pill ${SEVERITY_CLASS[ticket.severity]}`}>
                  {ticket.severity}
                </span>
                <span className="text-xs text-muted">{ticket.effortDays}d</span>
              </div>
              <p className="mt-1 text-xs text-muted">{ticket.context}</p>
            </div>
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-ink">
              <input
                type="checkbox"
                className="accent-brand"
                checked={keptIds.has(id)}
                onChange={() => onToggleKeep(id)}
              />
              Keep
            </label>
          </li>
        );
      })}
    </ul>
  );
}
