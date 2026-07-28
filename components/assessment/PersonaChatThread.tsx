"use client";

import type { Persona, DebugIncidentUpdate } from "@/lib/wse/scenarios/debug-incident/content";

const AVATAR_PALETTE = [
  "bg-brand-bg text-brand",
  "bg-accent-bg text-accent",
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
// untouched. Styled as a plain feed (persona chip row + stacked rows), not
// a messaging-app bubble thread - matching the prototype's actual "team
// chips + step-through feed" pattern rather than a chatbot look.
//
// Renders whatever `messages` it's given, in order - the parent scenario
// owns growing that array as branch responses come back from the server.
// There's no "reveal next" control here anymore: messages arrive because
// the candidate acted (or, for the ambient escalation, because time
// passed), not because they clicked to page through a static script.
export function PersonaChatThread({
  personas,
  messages,
  loading,
  children,
}: {
  personas: Persona[];
  messages: DebugIncidentUpdate[];
  loading?: boolean;
  children?: React.ReactNode;
}) {
  const byId = new Map(personas.map((p) => [p.id, p]));

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {personas.map((p) => (
          <span
            key={p.id}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${avatarClass(p.id)}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {p.name}
          </span>
        ))}
      </div>

      <div className="flex flex-col">
        {messages.map((m, i) => {
          const persona = byId.get(m.personaId);
          return (
            <div
              key={i}
              className="flex gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${avatarClass(
                  m.personaId
                )}`}
              >
                {persona ? initials(persona.name) : "?"}
              </span>
              <div>
                <div className="mb-0.5 text-xs font-semibold text-ink">
                  {persona?.name ?? m.personaId}
                </div>
                <p className="text-sm text-ink">{m.text}</p>
              </div>
            </div>
          );
        })}
        {loading && <p className="label-mono py-2">Waiting on the room…</p>}
      </div>

      {children}
    </div>
  );
}
