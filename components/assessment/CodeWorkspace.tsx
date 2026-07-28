"use client";

import { useState } from "react";
import { CodeEditorPane } from "./CodeEditorPane";
import type { DebugIncidentFile } from "@/lib/wse/scenarios/debug-incident/content";
import type { InputEvent } from "@/lib/wse/types";

// Generalizes CodeEditorPane from one file to a small file-tab strip. Only
// the active file's editor is mounted; switching files is a remount (key
// on file id) so CodeEditorPane's own "seed once on mount" contract still
// holds per-file, while `values` (owned by the parent) is what actually
// persists each file's latest content across switches.
export function CodeWorkspace({
  files,
  values,
  onChange,
  recordEvent,
}: {
  files: DebugIncidentFile[];
  values: Record<string, string>;
  onChange: (fileId: string, value: string) => void;
  recordEvent: (event: InputEvent) => void;
}) {
  const [activeId, setActiveId] = useState(files[0]?.id ?? "");
  const activeFile = files.find((f) => f.id === activeId) ?? files[0];

  function handleSwitch(id: string) {
    if (id === activeId) return;
    recordEvent({ type: "file_switched", fileId: id, t: Date.now() });
    setActiveId(id);
  }

  if (!activeFile) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-x-auto">
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleSwitch(f.id)}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
              f.id === activeFile.id
                ? "bg-brand-bg text-brand"
                : "text-muted hover:bg-surface-raised hover:text-ink"
            }`}
          >
            ‹/› {f.path}
          </button>
        ))}
      </div>
      <CodeEditorPane
        key={activeFile.id}
        value={values[activeFile.id] ?? activeFile.source}
        onChange={(value) => onChange(activeFile.id, value)}
        recordEvent={recordEvent}
        fieldName={`codeEditor:${activeFile.id}`}
      />
    </div>
  );
}
