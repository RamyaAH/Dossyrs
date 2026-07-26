"use client";

import type { Persona } from "@/lib/wse/scenarios/debug-incident/content";

export function SessionRail({
  progressLabel,
  personas,
}: {
  progressLabel: string;
  personas: Persona[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Session progress
        </h2>
        <p className="text-sm text-ink">{progressLabel}</p>
      </div>

      <div className="card">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          In the room
        </h2>
        <div className="flex flex-col gap-3">
          {personas.map((persona) => (
            <div key={persona.id}>
              <div className="text-sm font-semibold text-ink">
                {persona.name} <span className="font-normal text-muted">· {persona.role}</span>
              </div>
              <p className="text-xs text-muted">{persona.personality}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
