import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnedInProgressSession } from "@/lib/wse/sessionGuards";
import { callClaude, LlmConfigError, LlmRequestError } from "@/lib/llm/anthropic";
import { buildStakeholderInterviewSystemPrompt } from "@/lib/wse/scenarios/stakeholder-interview/script";
import {
  STAKEHOLDER_INTERVIEW_OPENING_MESSAGE,
  STAKEHOLDER_INTERVIEW_TURN_BUDGET,
} from "@/lib/wse/scenarios/stakeholder-interview/content";
import type { StakeholderInterviewTranscriptMessage } from "@/lib/wse/scenarios/stakeholder-interview/types";

const SLUG = "stakeholder-interview";
const MAX_MESSAGE_LENGTH = 2000;

interface ChatState {
  transcript: StakeholderInterviewTranscriptMessage[];
}

function parseChatState(raw: unknown): ChatState {
  if (raw && typeof raw === "object" && Array.isArray((raw as Partial<ChatState>).transcript)) {
    return { transcript: (raw as ChatState).transcript };
  }
  // First turn: seed with the opening message so the transcript the LLM
  // sees (and what eventually gets scored) always includes it.
  return {
    transcript: [{ role: "persona", text: STAKEHOLDER_INTERVIEW_OPENING_MESSAGE.text }],
  };
}

// Turn-by-turn: candidate sends a message, the server is the only thing
// that ever talks to the LLM and the only thing that persists what was
// actually said - mirrors debug-incident's branch route (server holds the
// authoritative record so the final transcript used for scoring can't be
// fabricated by the client), except the "next beat" here is generated,
// not looked up in a fixed table.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await getOwnedInProgressSession(supabase, params.id, user.id);
  if (!session || session.status !== "in_progress") {
    return NextResponse.json({ error: "Session not available" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { message } = body as { message?: string };
  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("wse_scenario_responses")
    .select("id, submitted_at, branch_state")
    .eq("session_id", params.id)
    .eq("scenario_slug", SLUG)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: "Failed to load scenario state" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Scenario not started" }, { status: 400 });
  }
  if (existing.submitted_at) {
    return NextResponse.json({ error: "Scenario already submitted" }, { status: 409 });
  }

  const state = parseChatState(existing.branch_state);
  const candidateTurnsSoFar = state.transcript.filter((m) => m.role === "candidate").length;
  if (candidateTurnsSoFar >= STAKEHOLDER_INTERVIEW_TURN_BUDGET) {
    return NextResponse.json({ error: "Turn budget reached — wrap up with your proposal" }, { status: 409 });
  }

  const priorCandidateMessages = state.transcript.filter((m) => m.role === "candidate").map((m) => m.text);

  const systemPrompt = buildStakeholderInterviewSystemPrompt({
    turnCount: candidateTurnsSoFar + 1,
    priorCandidateMessages,
  });

  const llmMessages = state.transcript.map((m) => ({
    role: m.role === "candidate" ? ("user" as const) : ("assistant" as const),
    content: m.text,
  }));
  llmMessages.push({ role: "user", content: message });

  let replyText: string;
  try {
    replyText = await callClaude({ systemPrompt, messages: llmMessages });
  } catch (err) {
    if (err instanceof LlmConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof LlmRequestError) {
      return NextResponse.json({ error: "The persona is unavailable right now — try again." }, { status: 502 });
    }
    return NextResponse.json({ error: "Unexpected error contacting the persona" }, { status: 500 });
  }

  const nextTranscript: StakeholderInterviewTranscriptMessage[] = [
    ...state.transcript,
    { role: "candidate", text: message },
    { role: "persona", text: replyText },
  ];

  const { error: updateError } = await supabase
    .from("wse_scenario_responses")
    .update({ branch_state: { transcript: nextTranscript } })
    .eq("id", existing.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    reply: replyText,
    candidateTurnsUsed: candidateTurnsSoFar + 1,
    turnBudget: STAKEHOLDER_INTERVIEW_TURN_BUDGET,
  });
}
