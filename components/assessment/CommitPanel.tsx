"use client";

import { useState } from "react";
import type { DebugIncidentFile } from "@/lib/wse/scenarios/debug-incident/content";
import type { InputEvent } from "@/lib/wse/types";

// Replaces the plain "Submit scenario" button with a lightweight, mocked
// git-style flow (branch -> commit -> push/merge) - no real VCS/network
// integration, purely a UI metaphor with its own deterministic event log.
// The completeness gate (canSubmit, computed by the parent from the
// write-up fields) is unchanged and still gates the final action here.
export function CommitPanel({
  files,
  values,
  canSubmit,
  submitting,
  onCommitAndSubmit,
  recordEvent,
}: {
  files: DebugIncidentFile[];
  values: Record<string, string>;
  canSubmit: boolean;
  submitting: boolean;
  onCommitAndSubmit: () => void | Promise<void>;
  recordEvent: (event: InputEvent) => void;
}) {
  const [branchName, setBranchName] = useState("main");
  const [branchCreated, setBranchCreated] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [committed, setCommitted] = useState(false);

  const changedFiles = files
    .filter((f) => (values[f.id] ?? f.source) !== f.source)
    .map((f) => f.path);

  function handleBranchBlur() {
    const trimmed = branchName.trim();
    if (trimmed && trimmed !== "main" && !branchCreated) {
      recordEvent({ type: "vcs_action", action: "branch_created", branchName: trimmed, t: Date.now() });
      setBranchCreated(true);
    }
  }

  function handleCommit() {
    if (!commitMessage.trim() || committed) return;
    recordEvent({
      type: "vcs_action",
      action: "commit",
      branchName: branchName.trim() || "main",
      message: commitMessage.trim(),
      changedFiles,
      t: Date.now(),
    });
    setCommitted(true);
  }

  async function handlePushOrMerge() {
    if (!canSubmit || !committed || submitting) return;
    recordEvent({
      type: "vcs_action",
      action: branchName.trim() === "main" ? "push" : "merge",
      branchName: branchName.trim() || "main",
      changedFiles,
      t: Date.now(),
    });
    await onCommitAndSubmit();
  }

  const isMain = (branchName.trim() || "main") === "main";

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <span className="label-mono">Branch</span>
        <input
          className="input flex-1"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          onBlur={handleBranchBlur}
          disabled={committed}
          placeholder="main"
        />
      </div>

      <p className="text-xs text-muted">
        Changed files: {changedFiles.length > 0 ? changedFiles.join(", ") : "none yet"}
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Commit message</span>
        <textarea
          className="rounded-md border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-brand"
          rows={2}
          placeholder="Describe what you changed and why"
          value={commitMessage}
          disabled={committed}
          onChange={(e) => setCommitMessage(e.target.value)}
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary self-start"
          disabled={!commitMessage.trim() || committed}
          onClick={handleCommit}
        >
          {committed ? "Committed" : "Commit"}
        </button>
        <button
          type="button"
          className="btn-primary self-start"
          disabled={!canSubmit || !committed || submitting}
          onClick={handlePushOrMerge}
        >
          {submitting ? "Submitting…" : isMain ? "Push to main" : `Merge ${branchName.trim()} → main`}
        </button>
      </div>
    </div>
  );
}
