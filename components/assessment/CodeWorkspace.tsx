"use client";

import { useMemo, useState } from "react";
import { CodeEditorPane } from "./CodeEditorPane";
import type { DebugIncidentFile } from "@/lib/wse/scenarios/debug-incident/content";
import type { InputEvent } from "@/lib/wse/types";

interface TreeFolder {
  type: "folder";
  name: string;
  path: string;
  children: TreeNode[];
}
interface TreeFile {
  type: "file";
  name: string;
  file: DebugIncidentFile;
}
type TreeNode = TreeFolder | TreeFile;

// Builds a folder tree from flat `path` strings (e.g. "services/order_service.py")
// - no folder objects in the source data, just derived from paths so
// content.ts stays a flat list to author.
function buildTree(files: DebugIncidentFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.path.split("/");
    let level = root;
    let pathSoFar = "";
    parts.forEach((part, i) => {
      pathSoFar = pathSoFar ? `${pathSoFar}/${part}` : part;
      if (i === parts.length - 1) {
        level.push({ type: "file", name: part, file });
        return;
      }
      let folder = level.find(
        (n): n is TreeFolder => n.type === "folder" && n.name === part
      );
      if (!folder) {
        folder = { type: "folder", name: part, path: pathSoFar, children: [] };
        level.push(folder);
      }
      level = folder.children;
    });
  }
  return root;
}

function FolderNode({
  node,
  activeId,
  onSelectFile,
}: {
  node: TreeNode;
  activeId: string;
  onSelectFile: (file: DebugIncidentFile) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (node.type === "file") {
    const isActive = node.file.id === activeId;
    return (
      <button
        type="button"
        onClick={() => onSelectFile(node.file)}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left font-mono text-xs transition-colors ${
          isActive ? "bg-brand-bg text-brand" : "text-muted hover:bg-surface-raised hover:text-ink"
        }`}
      >
        <span className="opacity-60">{node.file.editable ? "‹/›" : "▫"}</span>
        {node.name}
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left font-mono text-xs text-muted hover:text-ink"
      >
        <span className="opacity-60">{expanded ? "▾" : "▸"}</span>
        {node.name}/
      </button>
      {expanded && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-2">
          {node.children.map((child) => (
            <FolderNode
              key={child.type === "file" ? child.file.id : child.path}
              node={child}
              activeId={activeId}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Generalizes CodeEditorPane from a flat file strip into a small real
// project tree - most files are read-only "noise" for realism and are
// never part of the scored surface (only the two `editable` files ever
// mount a CodeMirror instance; everything else renders as plain text so
// non-Python files don't need their own language package, and so nothing
// implies a noise file "counts").
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
  const tree = useMemo(() => buildTree(files), [files]);
  const [activeId, setActiveId] = useState(files[0]?.id ?? "");
  const activeFile = files.find((f) => f.id === activeId) ?? files[0];

  function handleSelect(file: DebugIncidentFile) {
    if (file.id === activeId) return;
    recordEvent({ type: "file_switched", fileId: file.id, t: Date.now() });
    setActiveId(file.id);
  }

  if (!activeFile) return null;

  return (
    <div className="grid grid-cols-[160px_1fr] gap-3">
      <div className="flex flex-col gap-0.5 overflow-y-auto">
        {tree.map((node) => (
          <FolderNode
            key={node.type === "file" ? node.file.id : node.path}
            node={node}
            activeId={activeId}
            onSelectFile={handleSelect}
          />
        ))}
      </div>

      <div className="min-w-0">
        <div className="mb-1.5 font-mono text-[11px] text-muted">{activeFile.path}</div>
        {activeFile.editable ? (
          <CodeEditorPane
            key={activeFile.id}
            value={values[activeFile.id] ?? activeFile.source}
            onChange={(value) => onChange(activeFile.id, value)}
            recordEvent={recordEvent}
            fieldName={`codeEditor:${activeFile.id}`}
          />
        ) : (
          <pre className="h-full min-h-[20rem] overflow-auto rounded-md border border-border bg-surface p-3 font-mono text-xs text-muted">
            {activeFile.source}
          </pre>
        )}
      </div>
    </div>
  );
}
