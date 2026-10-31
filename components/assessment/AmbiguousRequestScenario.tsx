"use client";

import { useState } from "react";
import { ScenarioShell } from "./ScenarioShell";
import { FreeTextField } from "./FreeTextField";
import { PersonaChatThread } from "./PersonaChatThread";
import { useAssessmentTimer } from "@/hooks/useAssessmentTimer";
import { useFieldInputTracking } from "@/hooks/useFieldInputTracking";
import {
  AMBIGUOUS_REQUEST_BRIEFING,
  AMBIGUOUS_REQUEST_PERSONAS,
  AMBIGUOUS_REQUEST_QUESTIONS,
} from "@/lib/wse/scenarios/ambiguous-request/content";
import type { AmbiguousRequestPayload } from "@/lib/wse/scenarios/ambiguous-request/types";
import type { PersonaMessage } from "@/lib/wse/scenarios/shared/persona";
import type { InputEvent } from "@/lib/wse/types";

const MIN_ANSWER_LENGTH = 15;
const MIN_CUSTOM_QUESTION_LENGTH = 10;

export function AmbiguousRequestScenario({
  sessionId,
  progressLabel,
  onSubmit,
}: {
  sessionId: string;
  progressLabel: string;
  onSubmit: (payload: AmbiguousRequestPayload, events: InputEvent[]) => void | Promise<void>;
}) {
  const [startedAtMs] = useState(() => Date.now());
  const { formatted } = useAssessmentTimer(startedAtMs);
  const { getFieldHandlers, recordEvent, getEvents } = useFieldInputTracking();

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [customQuestion, setCustomQuestion] = useState("");
  const [implementationPlan, setImplementationPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [messages, setMessages] = useState<PersonaMessage[]>([]);
  const [askedTheRoom, setAskedTheRoom] = useState(false);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  function toggleQuestion(id: string) {
    if (askedTheRoom) return; // locked once asked - see the branch route's server-side enforcement
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      recordEvent({
        type: "select_change",
        field: "selectedQuestionIds",
        values: [...next],
        t: Date.now(),
      });
      return next;
    });
  }

  async function handleAskTheRoom() {
    if (askedTheRoom || asking || selectedQuestionIds.size === 0) return;
    setAsking(true);
    setAskError(null);

    try {
      const res = await fetch(
        `/api/wse/sessions/${sessionId}/scenarios/ambiguous-request/branch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedQuestionIds: [...selectedQuestionIds] }),
        }
      );
      if (!res.ok) throw new Error("branch request failed");
      const data: { personaMessages: PersonaMessage[] } = await res.json();

      recordEvent({
        type: "persona_reply_chosen",
        beatId: "questions",
        choice: [...selectedQuestionIds].join(","),
        role: "final",
        t: Date.now(),
      });

      setMessages(data.personaMessages);
      setAskedTheRoom(true); // disables the checkbox list below - server also rejects a second call
    } catch {
      setAskError("Couldn't reach the room — try again.");
    } finally {
      setAsking(false);
    }
  }

  const canSubmit =
    selectedQuestionIds.size > 0 &&
    askedTheRoom &&
    customQuestion.trim().length >= MIN_CUSTOM_QUESTION_LENGTH &&
    implementationPlan.trim().length >= MIN_ANSWER_LENGTH &&
    !submitting;

  async function handleSubmit() {
    setSubmitting(true);
    const payload: AmbiguousRequestPayload = {
      selectedQuestionIds: [...selectedQuestionIds],
      customQuestion,
      implementationPlan,
    };
    await onSubmit(payload, getEvents());
  }

  return (
    <ScenarioShell
      title={AMBIGUOUS_REQUEST_BRIEFING.title}
      progressLabel={progressLabel}
      elapsedFormatted={formatted}
    >
      <div className="flex flex-col gap-6">
        <p className="card text-sm text-ink">{AMBIGUOUS_REQUEST_BRIEFING.summary}</p>

        <div className="card flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink">
            Which questions would you actually need answered before starting?
          </h2>
          <div className="flex flex-col gap-2">
            {AMBIGUOUS_REQUEST_QUESTIONS.map((q) => (
              <label
                key={q.id}
                className={`flex items-start gap-2.5 rounded-md border border-border p-3 text-sm text-ink ${
                  askedTheRoom ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-surface-raised"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-brand"
                  checked={selectedQuestionIds.has(q.id)}
                  disabled={askedTheRoom}
                  onChange={() => toggleQuestion(q.id)}
                />
                {q.text}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn-secondary self-start"
            disabled={askedTheRoom || asking || selectedQuestionIds.size === 0}
            onClick={handleAskTheRoom}
          >
            {asking ? "Asking…" : askedTheRoom ? "Asked" : "Ask the room"}
          </button>
          {askError && <p className="text-sm text-danger">{askError}</p>}
        </div>

        {messages.length > 0 && (
          <PersonaChatThread personas={AMBIGUOUS_REQUEST_PERSONAS} messages={messages} />
        )}

        <div className="card flex flex-col gap-3">
          <FreeTextField
            label="Your own question"
            placeholder="What else would you want to know?"
            value={customQuestion}
            onChange={setCustomQuestion}
            minRows={2}
            {...getFieldHandlers("customQuestion")}
          />
        </div>

        <div className="card flex flex-col gap-4">
          <FreeTextField
            label="Implementation plan"
            placeholder="List your steps and the assumptions you're making, one per line."
            value={implementationPlan}
            onChange={setImplementationPlan}
            minRows={6}
            {...getFieldHandlers("implementationPlan")}
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
