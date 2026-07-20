"use client";

import { useState } from "react";
import { ScenarioShell } from "./ScenarioShell";
import { RankableList } from "./RankableList";
import { FreeTextField } from "./FreeTextField";
import { useAssessmentTimer } from "@/hooks/useAssessmentTimer";
import { useFieldInputTracking } from "@/hooks/useFieldInputTracking";
import {
  SPRINT_TRIAGE_BRIEFING,
  SPRINT_TRIAGE_CAPACITY_DAYS,
  SPRINT_TRIAGE_PUSHBACK_MESSAGE,
  SPRINT_TRIAGE_TECHNICAL_RISK_PROMPT,
  SPRINT_TRIAGE_TICKETS,
} from "@/lib/wse/scenarios/sprint-triage/content";
import type { SprintTriagePayload } from "@/lib/wse/scenarios/sprint-triage/types";
import type { InputEvent } from "@/lib/wse/types";

const MIN_ANSWER_LENGTH = 15;

export function SprintTriageScenario({
  progressLabel,
  onSubmit,
}: {
  progressLabel: string;
  onSubmit: (payload: SprintTriagePayload, events: InputEvent[]) => void | Promise<void>;
}) {
  const [startedAtMs] = useState(() => Date.now());
  const { formatted } = useAssessmentTimer(startedAtMs);
  const { getFieldHandlers, recordEvent, getEvents } = useFieldInputTracking();

  const [order, setOrder] = useState<string[]>(SPRINT_TRIAGE_TICKETS.map((t) => t.id));
  const [keptIds, setKeptIds] = useState<Set<string>>(new Set());
  const [pushbackAction, setPushbackAction] = useState<"held" | "changed" | null>(null);
  const [pushbackJustification, setPushbackJustification] = useState("");
  const [topJustification, setTopJustification] = useState("");
  const [technicalRiskAnswer, setTechnicalRiskAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effortById = new Map(SPRINT_TRIAGE_TICKETS.map((t) => [t.id, t.effortDays]));
  const keptEffort = [...keptIds].reduce((sum, id) => sum + (effortById.get(id) ?? 0), 0);

  function handleReorder(newOrder: string[]) {
    setOrder(newOrder);
    recordEvent({ type: "rank_change", field: "ticketOrder", order: newOrder, t: Date.now() });
  }

  function handleToggleKeep(id: string) {
    setKeptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      recordEvent({
        type: "select_change",
        field: "keptTicketIds",
        values: [...next],
        t: Date.now(),
      });
      return next;
    });
  }

  function handlePushbackAction(action: "held" | "changed") {
    setPushbackAction(action);
    recordEvent({ type: "action_choice", field: "pushback", value: action, t: Date.now() });
  }

  const canSubmit =
    keptIds.size > 0 &&
    pushbackAction !== null &&
    pushbackJustification.trim().length >= MIN_ANSWER_LENGTH &&
    topJustification.trim().length >= MIN_ANSWER_LENGTH &&
    technicalRiskAnswer.trim().length >= MIN_ANSWER_LENGTH &&
    !submitting;

  async function handleSubmit() {
    if (!pushbackAction) return;
    setSubmitting(true);
    const payload: SprintTriagePayload = {
      finalOrder: order,
      keptTicketIds: [...keptIds],
      pushback: { action: pushbackAction, justification: pushbackJustification },
      topJustification,
      technicalRiskAnswer,
    };
    await onSubmit(payload, getEvents());
  }

  return (
    <ScenarioShell
      title={SPRINT_TRIAGE_BRIEFING.title}
      progressLabel={progressLabel}
      elapsedFormatted={formatted}
    >
      <div className="flex flex-col gap-6">
        <p className="card text-sm text-ink">{SPRINT_TRIAGE_BRIEFING.summary}</p>

        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Backlog — rank and select</h2>
            <span
              className={`text-xs font-medium ${
                keptEffort > SPRINT_TRIAGE_CAPACITY_DAYS ? "text-danger" : "text-muted"
              }`}
            >
              {keptEffort}d kept / {SPRINT_TRIAGE_CAPACITY_DAYS}d capacity
            </span>
          </div>
          <RankableList
            tickets={SPRINT_TRIAGE_TICKETS}
            order={order}
            keptIds={keptIds}
            onReorder={handleReorder}
            onToggleKeep={handleToggleKeep}
          />
        </div>

        <div className="card flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink">{SPRINT_TRIAGE_PUSHBACK_MESSAGE.from}</h2>
          <p className="rounded-md border border-border bg-surface-raised p-3 text-sm text-ink">
            {SPRINT_TRIAGE_PUSHBACK_MESSAGE.text}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePushbackAction("held")}
              className={pushbackAction === "held" ? "btn-primary" : "btn-secondary"}
            >
              Hold current priority
            </button>
            <button
              type="button"
              onClick={() => handlePushbackAction("changed")}
              className={pushbackAction === "changed" ? "btn-primary" : "btn-secondary"}
            >
              Adjust priority
            </button>
          </div>
          {pushbackAction && (
            <FreeTextField
              label="Explain your response"
              placeholder="Why are you holding firm, or what would you cut to make room?"
              value={pushbackJustification}
              onChange={setPushbackJustification}
              {...getFieldHandlers("pushbackJustification")}
            />
          )}
        </div>

        <div className="card flex flex-col gap-4">
          <FreeTextField
            label="Why are your top priorities ranked where they are?"
            value={topJustification}
            onChange={setTopJustification}
            {...getFieldHandlers("topJustification")}
          />
          <FreeTextField
            label={SPRINT_TRIAGE_TECHNICAL_RISK_PROMPT}
            value={technicalRiskAnswer}
            onChange={setTechnicalRiskAnswer}
            {...getFieldHandlers("technicalRiskAnswer")}
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
      </div>
    </ScenarioShell>
  );
}
