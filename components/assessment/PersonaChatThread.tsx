"use client";

import type { Persona } from "@/lib/wse/scenarios/debug-incident/content";

const AVATAR_PALETTE = [
  "bg-brand-bg text-brand-dark",
  "bg-accent-bg text-accent-dark",
  "bg-warn-bg text-warn",
];

function avatarClass(personaId: string): string {
  let hash = 0;
  for (const char of personaId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Sibling to ChatThread, not a replacement - swapped in only for
// debug-incident so the shared ChatThread contract (used elsewhere) stays
// untouched. Same revealedCount/hasMore/onRequestNext mechanics, same
// underlying "next update" event - only the presentation is richer.
export function PersonaChatThread({
  personas,
  messages,
  revealedCount,
  hasMore,
  onRequestNext,
}: {
  personas: Persona[];
  messages: { personaId: string; text: string }[];
  revealedCount: number;
  hasMore: boolean;
  onRequestNext: () => void;
}) {
  const visible = messages.slice(0, revealedCount);
  const byId = new Map(personas.map((p) => [p.id, p]));

  return (
    <div className="card flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-ink">Incident thread</h2>
      <div className="flex flex-col gap-2.5">
        {visible.map((m, i) => {
          const persona = byId.get(m.personaId);
          return (
            <div
              key={i}
              className="flex gap-2.5 rounded-md border border-border bg-surface-raised p-3"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${avatarClass(
                  m.personaId
                )}`}
              >
                {persona ? initials(persona.name) : "?"}
              </span>
              <div>
                <div className="mb-1 text-xs font-semibold text-ink">
                  {persona?.name ?? m.personaId}
                  {persona && <span className="ml-1.5 font-normal text-muted">{persona.role}</span>}
                </div>
                <p className="text-sm text-ink">{m.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <button type="button" onClick={onRequestNext} className="btn-secondary self-start">
          Get next update
        </button>
      )}
    </div>
  );
}
