"use client";

import { useState } from "react";
import { ScenarioShell } from "./ScenarioShell";
import { RankableList } from "./RankableList";
import { FreeTextField } from "./FreeTextField";
import { PersonaChatThread } from "./PersonaChatThread";
import { useAssessmentTimer } from "@/hooks/useAssessmentTimer";
import { useFieldInputTracking } from "@/hooks/useFieldInputTracking";
import {
  SPRINT_TRIAGE_BRIEFING,
  SPRINT_TRIAGE_CAPACITY_DAYS,
  SPRINT_TRIAGE_OPENING_MESSAGE,
  SPRINT_TRIAGE_PERSONAS,
  SPRINT_TRIAGE_TECHNICAL_RISK_PROMPT,
  SPRINT_TRIAGE_TICKETS,
} from "@/lib/wse/scenarios/sprint-triage/content";
import type { SprintTriagePayload } from "@/lib/wse/scenarios/sprint-triage/types";
import type { PersonaMessage } from "@/lib/wse/scenarios/shared/persona";
import type { InputEvent } from "@/lib/wse/types";

const MIN_ANSWER_LENGTH = 15;

type BeatId = "pushback" | "confirm" | "resolved";

interface BranchResponse {
  nextBeatId: BeatId;
  personaMessages: PersonaMessage[];
}

function PushbackButtons({
  onChoose,
  disabled,
}: {
  onChoose: (action: "held" | "changed") => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="btn-secondary"
        disabled={disabled}
        onClick={() => onChoose("held")}
      >
        Hold current priority
      </button>
      <button
        type="button"
        className="btn-secondary"
        disabled={disabled}
        onClick={() => onChoose("changed")}
      >
        Adjust priority
      </button>
    </div>
  );
}

export function SprintTriageScenario({
  sessionId,
  progressLabel,
  onSubmit,
}: {
  sessionId: string;
  progressLabel: string;
  onSubmit: (payload: SprintTriagePayload, events: InputEvent[]) => void | Promise<void>;
}) {
  const [startedAtMs] = useState(() => Date.now());
  const { formatted } = useAssessmentTimer(startedAtMs);
  const { getFieldHandlers, recordEvent, getEvents } = useFieldInputTracking();

  const [order, setOrder] = useState<string[]>(SPRINT_TRIAGE_TICKETS.map((t) => t.id));
  const [keptIds, setKeptIds] = useState<Set<string>>(new Set());
  const [topJustification, setTopJustification] = useState("");
  const [technicalRiskAnswer, setTechnicalRiskAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [messages, setMessages] = useState<PersonaMessage[]>([SPRINT_TRIAGE_OPENING_MESSAGE]);
  const [beatId, setBeatId] = useState<BeatId>("pushback");
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [pushbackAction, setPushbackAction] = useState<"held" | "changed" | null>(null);
  const [pushbackJustification, setPushbackJustification] = useState("");
  const [finalAction, setFinalAction] = useState<"held" | "changed" | null>(null);
  const [msElapsedWhenInitial, setMsElapsedWhenInitial] = useState<number | null>(null);
  const [msElapsedWhenFinal, setMsElapsedWhenFinal] = useState<number | null>(null);

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

  async function handlePushbackChoice(action: "held" | "changed") {
    if (beatId === "resolved" || branchLoading) return;
    setBranchLoading(true);
    setBranchError(null);

    try {
      const res = await fetch(`/api/wse/sessions/${sessionId}/scenarios/sprint-triage/branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beatId, action }),
      });
      if (!res.ok) throw new Error("branch request failed");
      const data: BranchResponse = await res.json();

      const role: "interim" | "final" = beatId === "pushback" ? "interim" : "final";
      const elapsed = Date.now() - startedAtMs;
      recordEvent({ type: "persona_reply_chosen", beatId, choice: action, role, t: Date.now() });

      if (role === "interim") {
        setPushbackAction(action);
        setMsElapsedWhenInitial(elapsed);
      } else {
        setFinalAction(action);
        setMsElapsedWhenFinal(elapsed);
      }

      setMessages((prev) => [...prev, ...data.personaMessages]);
      setBeatId(data.nextBeatId);
    } catch {
      setBranchError("Couldn't reach the room — try again.");
    } finally {
      setBranchLoading(false);
    }
  }

  const canSubmit =
    keptIds.size > 0 &&
    pushbackAction !== null &&
    finalAction !== null &&
    pushbackJustification.trim().length >= MIN_ANSWER_LENGTH &&
    topJustification.trim().length >= MIN_ANSWER_LENGTH &&
    technicalRiskAnswer.trim().length >= MIN_ANSWER_LENGTH &&
    !submitting;

  async function handleSubmit() {
    if (!pushbackAction || !finalAction || msElapsedWhenInitial == null || msElapsedWhenFinal == null) {
      return;
    }
    setSubmitting(true);
    const payload: SprintTriagePayload = {
      finalOrder: order,
      keptTicketIds: [...keptIds],
      pushback: {
        action: pushbackAction,
        justification: pushbackJustification,
        finalAction,
        changedFromInitial: finalAction !== pushbackAction,
        msElapsedWhenInitial,
        msElapsedWhenFinal,
      },
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

        <PersonaChatThread personas={SPRINT_TRIAGE_PERSONAS} messages={messages} loading={branchLoading}>
          {beatId === "pushback" && (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Your call
              </h3>
              <PushbackButtons onChoose={handlePushbackChoice} disabled={branchLoading} />
            </div>
          )}

          {(beatId === "confirm" || beatId === "resolved") && pushbackAction && (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <FreeTextField
                label="Explain your response"
                placeholder="Why are you holding firm, or what would you cut to make room?"
                value={pushbackJustification}
                onChange={setPushbackJustification}
                {...getFieldHandlers("pushbackJustification")}
              />
              {beatId === "confirm" && (
                <>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Final call — confirm or revise after that response
                  </h3>
                  <PushbackButtons onChoose={handlePushbackChoice} disabled={branchLoading} />
                </>
              )}
              {beatId === "resolved" && finalAction && (
                <p className="label-mono">
                  Final call: {finalAction === "held" ? "Held current priority" : "Adjusted priority"}
                </p>
              )}
            </div>
          )}

          {branchError && <p className="text-sm text-danger">{branchError}</p>}
        </PersonaChatThread>

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
