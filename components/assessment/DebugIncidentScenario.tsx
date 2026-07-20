"use client";

import { useMemo, useState } from "react";
import { ScenarioShell } from "./ScenarioShell";
import { EvidencePane } from "./EvidencePane";
import { ChatThread } from "./ChatThread";
import { FreeTextField } from "./FreeTextField";
import { useAssessmentTimer } from "@/hooks/useAssessmentTimer";
import { useFieldInputTracking } from "@/hooks/useFieldInputTracking";
import {
  DEBUG_INCIDENT_ACTION_OPTIONS,
  DEBUG_INCIDENT_ARCHITECTURE_NOTES,
  DEBUG_INCIDENT_BRIEFING,
  DEBUG_INCIDENT_DIFF,
  DEBUG_INCIDENT_LOG_LINES,
  DEBUG_INCIDENT_UPDATES,
} from "@/lib/wse/scenarios/debug-incident/content";
import type {
  DebugActionChoice,
  DebugIncidentPayload,
} from "@/lib/wse/scenarios/debug-incident/types";
import type { InputEvent } from "@/lib/wse/types";

const MIN_ANSWER_LENGTH = 15;

function ActionPicker({
  value,
  onChange,
}: {
  value: DebugActionChoice | null;
  onChange: (choice: DebugActionChoice) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {DEBUG_INCIDENT_ACTION_OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-3 text-sm transition-colors ${
            value === opt.value
              ? "border-brand bg-brand-bg text-brand-dark"
              : "border-border bg-surface text-ink hover:bg-surface-raised"
          }`}
        >
          <input
            type="radio"
            className="accent-brand"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export function DebugIncidentScenario({
  progressLabel,
  onSubmit,
}: {
  progressLabel: string;
  onSubmit: (payload: DebugIncidentPayload, events: InputEvent[]) => void | Promise<void>;
}) {
  const [startedAtMs] = useState(() => Date.now());
  const { formatted } = useAssessmentTimer(startedAtMs);
  const { getFieldHandlers, recordEvent, getEvents } = useFieldInputTracking();

  const [revealedCount, setRevealedCount] = useState(1);
  const [checkpoint1, setCheckpoint1] = useState<DebugActionChoice | null>(null);
  const [checkpoint1ViewedBefore, setCheckpoint1ViewedBefore] = useState(0);
  const [checkpoint2, setCheckpoint2] = useState<DebugActionChoice | null>(null);
  const [checkpoint2ViewedBefore, setCheckpoint2ViewedBefore] = useState(0);
  const [rootCause, setRootCause] = useState("");
  const [fix, setFix] = useState("");
  const [validationPlan, setValidationPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasMoreUpdates = revealedCount < DEBUG_INCIDENT_UPDATES.length;

  function handleRequestNextUpdate() {
    setRevealedCount((count) => {
      const next = Math.min(DEBUG_INCIDENT_UPDATES.length, count + 1);
      recordEvent({ type: "next_update_requested", updateIndex: next - 1, t: Date.now() });
      return next;
    });
  }

  function handleCheckpoint1Change(choice: DebugActionChoice) {
    setCheckpoint1(choice);
    setCheckpoint1ViewedBefore(revealedCount - 1);
    recordEvent({ type: "action_choice", field: "checkpoint1", value: choice, t: Date.now() });
    if (checkpoint2 === null) {
      setCheckpoint2(choice);
      setCheckpoint2ViewedBefore(revealedCount - 1);
    }
  }

  function handleCheckpoint2Change(choice: DebugActionChoice) {
    setCheckpoint2(choice);
    setCheckpoint2ViewedBefore(revealedCount - 1);
    recordEvent({ type: "action_choice", field: "checkpoint2", value: choice, t: Date.now() });
  }

  const evidenceTabs = useMemo(
    () => [
      {
        id: "log",
        label: "Error log",
        content: (
          <div className="flex flex-col gap-1 font-mono text-xs">
            {DEBUG_INCIDENT_LOG_LINES.map((line, i) => (
              <div
                key={i}
                className={`rounded px-2 py-1 ${
                  "flagged" in line && line.flagged ? "bg-warn-bg" : ""
                }`}
              >
                <span className="text-muted">{line.time}</span>{" "}
                <span
                  className={line.level === "ERROR" ? "font-semibold text-danger" : "text-muted"}
                >
                  {line.level}
                </span>{" "}
                <span className="text-ink">{line.msg}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "diff",
        label: "Recent change",
        content: (
          <div className="font-mono text-xs">
            <div className="mb-2 text-muted">{DEBUG_INCIDENT_DIFF.file}</div>
            {DEBUG_INCIDENT_DIFF.hunk.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === "add"
                    ? "bg-success-bg text-success"
                    : line.type === "remove"
                      ? "bg-danger-bg text-danger"
                      : "text-ink"
                }
              >
                {line.type === "add" ? "+ " : line.type === "remove" ? "- " : "  "}
                {line.text}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "architecture",
        label: "Architecture notes",
        content: (
          <ul className="list-disc space-y-2 pl-4 text-sm text-ink">
            {DEBUG_INCIDENT_ARCHITECTURE_NOTES.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        ),
      },
    ],
    []
  );

  const canSubmit =
    checkpoint1 !== null &&
    checkpoint2 !== null &&
    rootCause.trim().length >= MIN_ANSWER_LENGTH &&
    fix.trim().length >= MIN_ANSWER_LENGTH &&
    validationPlan.trim().length >= MIN_ANSWER_LENGTH &&
    !submitting;

  async function handleSubmit() {
    if (!checkpoint1 || !checkpoint2) return;
    setSubmitting(true);
    const payload: DebugIncidentPayload = {
      checkpoint1: { choice: checkpoint1, updatesViewedBefore: checkpoint1ViewedBefore },
      checkpoint2: {
        choice: checkpoint2,
        updatesViewedBefore: checkpoint2ViewedBefore,
        changedFromCheckpoint1: checkpoint2 !== checkpoint1,
      },
      rootCause,
      fix,
      validationPlan,
    };
    await onSubmit(payload, getEvents());
  }

  return (
    <ScenarioShell
      title={DEBUG_INCIDENT_BRIEFING.title}
      severityLabel={DEBUG_INCIDENT_BRIEFING.severity}
      progressLabel={progressLabel}
      elapsedFormatted={formatted}
    >
      <div className="flex flex-col gap-6">
        <p className="card text-sm text-ink">{DEBUG_INCIDENT_BRIEFING.summary}</p>

        <EvidencePane tabs={evidenceTabs} />

        <ChatThread
          messages={DEBUG_INCIDENT_UPDATES}
          revealedCount={revealedCount}
          hasMore={hasMoreUpdates}
          onRequestNext={handleRequestNextUpdate}
        />

        <div className="card flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink">Interim action — first call</h2>
          <ActionPicker value={checkpoint1} onChange={handleCheckpoint1Change} />
        </div>

        {checkpoint1 && (
          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-ink">
              Final action — revise if the later updates change your read
            </h2>
            <ActionPicker value={checkpoint2} onChange={handleCheckpoint2Change} />
          </div>
        )}

        {checkpoint1 && checkpoint2 && (
          <div className="card flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-ink">Write-up</h2>
            <FreeTextField
              label="Root cause"
              placeholder="What actually caused Meridian's failures?"
              value={rootCause}
              onChange={setRootCause}
              {...getFieldHandlers("rootCause")}
            />
            <FreeTextField
              label="Fix"
              placeholder="What would you change to resolve this?"
              value={fix}
              onChange={setFix}
              {...getFieldHandlers("fix")}
            />
            <FreeTextField
              label="Validation plan"
              placeholder="How would you confirm the fix worked and watch for regressions?"
              value={validationPlan}
              onChange={setValidationPlan}
              {...getFieldHandlers("validationPlan")}
            />
            <button
              type="button"
              className="btn-primary self-start"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting…" : "Submit scenario"}
            </button>
          </div>
        )}
      </div>
    </ScenarioShell>
  );
}
