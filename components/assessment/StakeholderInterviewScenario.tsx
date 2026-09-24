"use client";

import { useState } from "react";
import { ScenarioShell } from "./ScenarioShell";
import { PersonaChatThread } from "./PersonaChatThread";
import { FreeTextField } from "./FreeTextField";
import { useAssessmentTimer } from "@/hooks/useAssessmentTimer";
import { useFieldInputTracking } from "@/hooks/useFieldInputTracking";
import {
  STAKEHOLDER_INTERVIEW_BRIEFING,
  STAKEHOLDER_INTERVIEW_OPENING_MESSAGE,
  STAKEHOLDER_INTERVIEW_PERSONA,
  STAKEHOLDER_INTERVIEW_PROPOSAL_FIELD,
  STAKEHOLDER_INTERVIEW_TURN_BUDGET,
} from "@/lib/wse/scenarios/stakeholder-interview/content";
import type {
  StakeholderInterviewPayload,
  StakeholderInterviewTranscriptMessage,
} from "@/lib/wse/scenarios/stakeholder-interview/types";
import type { InputEvent } from "@/lib/wse/types";

export function StakeholderInterviewScenario({
  sessionId,
  progressLabel,
  onSubmit,
}: {
  sessionId: string;
  progressLabel: string;
  onSubmit: (payload: StakeholderInterviewPayload, events: InputEvent[]) => void | Promise<void>;
}) {
  const [startedAtMs] = useState(() => Date.now());
  const { formatted } = useAssessmentTimer(startedAtMs);
  const { getFieldHandlers, getEvents } = useFieldInputTracking();

  const [messages, setMessages] = useState<{ personaId: string; text: string }[]>([
    STAKEHOLDER_INTERVIEW_OPENING_MESSAGE,
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [turnsUsed, setTurnsUsed] = useState(0);
  const [wrappingUp, setWrappingUp] = useState(false);
  const [proposal, setProposal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const turnBudgetReached = turnsUsed >= STAKEHOLDER_INTERVIEW_TURN_BUDGET;

  async function sendMessage() {
    const text = draft.trim();
    if (!text || sending || turnBudgetReached) return;
    setSending(true);
    setSendError(null);

    const res = await fetch(`/api/wse/sessions/${sessionId}/scenarios/stakeholder-interview/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSendError(body.error ?? "Something went wrong sending that message.");
      setSending(false);
      return;
    }

    const data = (await res.json()) as { reply: string; candidateTurnsUsed: number };
    setMessages((prev) => [
      ...prev,
      { personaId: "candidate", text },
      { personaId: STAKEHOLDER_INTERVIEW_PERSONA.id, text: data.reply },
    ]);
    setTurnsUsed(data.candidateTurnsUsed);
    setDraft("");
    setSending(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const transcript: StakeholderInterviewTranscriptMessage[] = messages.map((m) => ({
      role: m.personaId === "candidate" ? "candidate" : "persona",
      text: m.text,
    }));
    await onSubmit({ transcript, proposal }, getEvents());
  }

  const canSubmitProposal =
    proposal.trim().length >= STAKEHOLDER_INTERVIEW_PROPOSAL_FIELD.minLength && !submitting;

  return (
    <ScenarioShell
      title={STAKEHOLDER_INTERVIEW_BRIEFING.title}
      progressLabel={progressLabel}
      elapsedFormatted={formatted}
    >
      <div className="flex flex-col gap-6">
        <p className="card text-sm text-ink">{STAKEHOLDER_INTERVIEW_BRIEFING.summary}</p>

        <PersonaChatThread
          personas={[
            { id: STAKEHOLDER_INTERVIEW_PERSONA.id, name: STAKEHOLDER_INTERVIEW_PERSONA.name, role: STAKEHOLDER_INTERVIEW_PERSONA.role, personality: STAKEHOLDER_INTERVIEW_PERSONA.personality },
            { id: "candidate", name: "You", role: "You", personality: "" },
          ]}
          messages={messages}
          loading={sending}
        >
          {!wrappingUp && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="label-mono">
                  {turnsUsed} / {STAKEHOLDER_INTERVIEW_TURN_BUDGET} questions used
                </span>
                {turnsUsed > 0 && (
                  <button type="button" className="btn-secondary" onClick={() => setWrappingUp(true)}>
                    Wrap up and write proposal
                  </button>
                )}
              </div>
              {!turnBudgetReached ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-border bg-surface p-2.5 text-sm text-ink outline-none focus:border-brand"
                    placeholder="Ask Jordan something…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={sending}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={sending || !draft.trim()}
                    onClick={sendMessage}
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  You&apos;ve used all your questions — write up your proposal below.
                </p>
              )}
              {sendError && <p className="text-sm text-danger">{sendError}</p>}
            </div>
          )}
        </PersonaChatThread>

        {(wrappingUp || turnBudgetReached) && (
          <div className="card flex flex-col gap-4">
            <FreeTextField
              label={STAKEHOLDER_INTERVIEW_PROPOSAL_FIELD.label}
              placeholder={STAKEHOLDER_INTERVIEW_PROPOSAL_FIELD.placeholder}
              minRows={6}
              value={proposal}
              onChange={setProposal}
              {...getFieldHandlers("proposal")}
            />
            <button
              type="button"
              className="btn-primary self-start"
              disabled={!canSubmitProposal}
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
