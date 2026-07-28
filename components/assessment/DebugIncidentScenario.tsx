"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ScenarioShell } from "./ScenarioShell";
import { EvidencePane } from "./EvidencePane";
import { PersonaChatThread } from "./PersonaChatThread";
import { FreeTextField } from "./FreeTextField";
import { CodeWorkspace } from "./CodeWorkspace";
import { CommitPanel } from "./CommitPanel";
import { DeliverablesChecklist } from "./DeliverablesChecklist";
import { SessionRail } from "./SessionRail";
import { useAssessmentTimer } from "@/hooks/useAssessmentTimer";
import { useFieldInputTracking } from "@/hooks/useFieldInputTracking";
import {
  DEBUG_INCIDENT_ACTION_OPTIONS,
  DEBUG_INCIDENT_ARCHITECTURE_NOTES,
  DEBUG_INCIDENT_BRIEFING,
  DEBUG_INCIDENT_DIFF,
  DEBUG_INCIDENT_FILES,
  DEBUG_INCIDENT_INFRA_RESOURCES,
  DEBUG_INCIDENT_LOG_LINES,
  DEBUG_INCIDENT_OPENING_MESSAGE,
  DEBUG_INCIDENT_PERSONAS,
  type DebugIncidentUpdate,
} from "@/lib/wse/scenarios/debug-incident/content";
import type {
  DebugActionChoice,
  DebugCheckpointAnswer,
  DebugIncidentPayload,
} from "@/lib/wse/scenarios/debug-incident/types";
import type { InputEvent } from "@/lib/wse/types";

// Loaded only when the SQL sandbox tab is actually rendered (EvidencePane
// only mounts the active tab's content) - the sql.js worker/WASM setup
// never ends up in this scenario's initial bundle.
const SqlSandboxPane = dynamic(() => import("./SqlSandboxPane"), { ssr: false });

const MIN_ANSWER_LENGTH = 15;

type BeatId = "start" | "final" | "resolved";

interface BranchResponse {
  nextBeatId: BeatId;
  personaMessages: DebugIncidentUpdate[];
  ambientEscalationTriggered: boolean;
}

function ActionPicker({
  value,
  onChange,
  disabled,
}: {
  value: DebugActionChoice | null;
  onChange: (choice: DebugActionChoice) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {DEBUG_INCIDENT_ACTION_OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-3 text-sm transition-colors ${
            value === opt.value
              ? "border-brand bg-brand-bg text-brand"
              : "border-border bg-surface text-ink hover:bg-surface-raised"
          } ${disabled ? "pointer-events-none opacity-50" : ""}`}
        >
          <input
            type="radio"
            className="accent-brand"
            checked={value === opt.value}
            disabled={disabled}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function choiceLabel(choice: DebugActionChoice): string {
  return DEBUG_INCIDENT_ACTION_OPTIONS.find((o) => o.value === choice)?.label ?? choice;
}

export function DebugIncidentScenario({
  sessionId,
  progressLabel,
  onSubmit,
}: {
  sessionId: string;
  progressLabel: string;
  onSubmit: (payload: DebugIncidentPayload, events: InputEvent[]) => void | Promise<void>;
}) {
  const [startedAtMs] = useState(() => Date.now());
  const { formatted } = useAssessmentTimer(startedAtMs);
  const { getFieldHandlers, recordEvent, getEvents } = useFieldInputTracking();

  const [messages, setMessages] = useState<DebugIncidentUpdate[]>([DEBUG_INCIDENT_OPENING_MESSAGE]);
  const [beatId, setBeatId] = useState<BeatId>("start");
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [checkpoint1, setCheckpoint1] = useState<DebugCheckpointAnswer | null>(null);
  const [checkpoint2, setCheckpoint2] = useState<
    (DebugCheckpointAnswer & { changedFromCheckpoint1: boolean }) | null
  >(null);

  const [rootCause, setRootCause] = useState("");
  const [fix, setFix] = useState("");
  const [validationPlan, setValidationPlan] = useState("");
  const [codeEditValues, setCodeEditValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function handleCodeChange(fileId: string, value: string) {
    setCodeEditValues((prev) => ({ ...prev, [fileId]: value }));
  }

  async function handleChoice(choice: DebugActionChoice) {
    if (beatId === "resolved" || branchLoading) return;
    setBranchLoading(true);
    setBranchError(null);

    try {
      const res = await fetch(
        `/api/wse/sessions/${sessionId}/scenarios/debug-incident/branch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beatId, choice }),
        }
      );
      if (!res.ok) throw new Error("branch request failed");
      const data: BranchResponse = await res.json();

      const role: "interim" | "final" = beatId === "start" ? "interim" : "final";
      const msElapsedWhenChosen = Date.now() - startedAtMs;

      if (data.ambientEscalationTriggered) {
        recordEvent({ type: "ambient_escalation_shown", beatId, t: Date.now() });
      }
      recordEvent({ type: "persona_reply_chosen", beatId, choice, role, t: Date.now() });

      if (role === "interim") {
        setCheckpoint1({ choice, msElapsedWhenChosen });
      } else {
        setCheckpoint2({
          choice,
          msElapsedWhenChosen,
          changedFromCheckpoint1: checkpoint1 ? choice !== checkpoint1.choice : false,
        });
      }

      setMessages((prev) => [...prev, ...data.personaMessages]);
      setBeatId(data.nextBeatId);
    } catch {
      setBranchError("Couldn't reach the room — try again.");
    } finally {
      setBranchLoading(false);
    }
  }

  const evidenceTabs = useMemo(
    () => [
      {
        id: "log",
        label: "📄 Error log",
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
        label: "🔀 Recent changes",
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
        id: "editor",
        label: "‹/› Code",
        content: (
          <CodeWorkspace
            files={DEBUG_INCIDENT_FILES}
            values={codeEditValues}
            onChange={handleCodeChange}
            recordEvent={recordEvent}
          />
        ),
      },
      {
        id: "architecture",
        label: "🗺️ Architecture",
        content: (
          <ul className="list-disc space-y-2 pl-4 text-sm text-ink">
            {DEBUG_INCIDENT_ARCHITECTURE_NOTES.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        ),
      },
      {
        id: "sql",
        label: "🗄️ SQL sandbox",
        content: <SqlSandboxPane recordEvent={recordEvent} />,
      },
      {
        id: "infra",
        label: "☁️ Infra resources",
        content: (
          <dl className="flex flex-col gap-2 text-sm">
            {DEBUG_INCIDENT_INFRA_RESOURCES.map((row, i) => (
              <div key={i} className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
                <dt className="text-muted">{row.label}</dt>
                <dd className="text-right font-mono text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        ),
      },
    ],
    [recordEvent, codeEditValues]
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
    const files: Record<string, string> = {};
    for (const f of DEBUG_INCIDENT_FILES) {
      files[f.id] = codeEditValues[f.id] ?? f.source;
    }
    const payload: DebugIncidentPayload = {
      checkpoint1,
      checkpoint2,
      rootCause,
      fix,
      validationPlan,
      codeEdit: { files },
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
      <p className="card mb-6 text-sm text-ink">{DEBUG_INCIDENT_BRIEFING.summary}</p>

      {/* Three-column workspace: work panel (evidence + write-up) | persona
          feed (chips, updates, checkpoints) | session rail. Matches the
          prototype's actual sim-shell proportions - this is a persistent
          workspace with a supporting conversation alongside it, not a
          chat screen with some tabs bolted on. */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.3fr_1fr_260px]">
        {/* LEFT: workspace */}
        <div className="flex h-full min-h-0 flex-col gap-6">
          <EvidencePane tabs={evidenceTabs} />

          <div className="card flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">Your diagnosis &amp; plan</h2>
              <DeliverablesChecklist
                items={[
                  { label: "Root cause", done: rootCause.trim().length >= MIN_ANSWER_LENGTH },
                  { label: "Fix", done: fix.trim().length >= MIN_ANSWER_LENGTH },
                  {
                    label: "Validation",
                    done: validationPlan.trim().length >= MIN_ANSWER_LENGTH,
                  },
                ]}
              />
            </div>
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
            <CommitPanel
              files={DEBUG_INCIDENT_FILES}
              values={codeEditValues}
              canSubmit={canSubmit}
              submitting={submitting}
              onCommitAndSubmit={handleSubmit}
              recordEvent={recordEvent}
            />
          </div>
        </div>

        {/* MIDDLE: persona feed + inline checkpoints, now driven by the
            server-side branching engine - what the team says next depends
            on the choice actually made, not on a fixed reveal order. */}
        <PersonaChatThread personas={DEBUG_INCIDENT_PERSONAS} messages={messages} loading={branchLoading}>
          {beatId === "start" && (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Interim action — first call
              </h3>
              <ActionPicker value={null} onChange={handleChoice} disabled={branchLoading} />
            </div>
          )}

          {beatId === "final" && checkpoint1 && (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <p className="label-mono">Your first call: {choiceLabel(checkpoint1.choice)}</p>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Final action — revise if the room's response changes your read
              </h3>
              <ActionPicker value={null} onChange={handleChoice} disabled={branchLoading} />
            </div>
          )}

          {beatId === "resolved" && checkpoint2 && (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <p className="label-mono">Final call: {choiceLabel(checkpoint2.choice)}</p>
              <p className="text-sm text-muted">
                Team aligned. Finish your write-up on the left when ready.
              </p>
            </div>
          )}

          {branchError && <p className="text-sm text-danger">{branchError}</p>}
        </PersonaChatThread>

        {/* RIGHT: session rail */}
        <SessionRail progressLabel={progressLabel} personas={DEBUG_INCIDENT_PERSONAS} />
      </div>
    </ScenarioShell>
  );
}
