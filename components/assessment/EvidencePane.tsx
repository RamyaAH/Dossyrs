"use client";

import { useState } from "react";

export function EvidencePane({
  tabs,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className="card flex min-h-[28rem] flex-1 flex-col overflow-hidden p-0">
      <div className="flex overflow-x-auto border-b border-border bg-surface-raised">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors ${
              tab.id === active?.id
                ? "border-b-2 border-brand text-brand"
                : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">{active?.content}</div>
    </div>
  );
}
