import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnedInProgressSession } from "@/lib/wse/sessionGuards";
import { resolveBranch, type BeatId } from "@/lib/wse/scenarios/debug-incident/branch";
import type { DebugActionChoice } from "@/lib/wse/scenarios/debug-incident/types";

const SLUG = "debug-incident";

interface BranchState {
  currentBeatId: BeatId;
  ambientEscalationShown: boolean;
}

function parseBranchState(raw: unknown): BranchState {
  if (raw && typeof raw === "object" && "currentBeatId" in raw) {
    const s = raw as Partial<BranchState>;
    return {
      currentBeatId: (s.currentBeatId as BeatId) ?? "start",
      ambientEscalationShown: Boolean(s.ambientEscalationShown),
    };
  }
  return { currentBeatId: "start", ambientEscalationShown: false };
}

// Stateless-looking to the client, but authoritative server-side: the
// client tells us what beat and choice it's acting on, we verify that
// matches what we last told it (rejecting stale/forged replays), and we
// compute elapsed time ourselves rather than trusting anything the client
// sends. This is what makes the branching genuinely resistant to
// devtools/curl probing, not just "hidden because the JS wasn't shipped".
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
  const { beatId, choice } = body as { beatId?: string; choice?: string };
  if (!beatId || !choice) {
    return NextResponse.json({ error: "Missing beatId or choice" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("wse_scenario_responses")
    .select("id, started_at, submitted_at, branch_state")
    .eq("session_id", params.id)
    .eq("scenario_slug", SLUG)
    .single();

  // A real query error (bad connection, missing column, RLS denial) isn't
  // the same condition as "candidate hasn't started this scenario yet" -
  // conflating them here previously produced a misleading 400 for what was
  // actually a 500-worthy failure.
  if (fetchError) {
    return NextResponse.json({ error: "Failed to load scenario state" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Scenario not started" }, { status: 400 });
  }
  if (existing.submitted_at) {
    return NextResponse.json({ error: "Scenario already submitted" }, { status: 409 });
  }

  const state = parseBranchState(existing.branch_state);
  if (state.currentBeatId !== beatId) {
    return NextResponse.json({ error: "Stale beat — refresh and try again" }, { status: 409 });
  }

  const serverElapsedMs = Date.now() - new Date(existing.started_at).getTime();

  const result = resolveBranch(
    state.currentBeatId,
    choice as DebugActionChoice,
    serverElapsedMs,
    state.ambientEscalationShown
  );

  if (!result) {
    return NextResponse.json({ error: "Invalid beat or choice" }, { status: 400 });
  }

  const nextState: BranchState = {
    currentBeatId: result.nextBeatId,
    ambientEscalationShown: state.ambientEscalationShown || result.ambientEscalationTriggered,
  };

  const { error } = await supabase
    .from("wse_scenario_responses")
    .update({ branch_state: nextState })
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    nextBeatId: result.nextBeatId,
    personaMessages: result.personaMessages,
    ambientEscalationTriggered: result.ambientEscalationTriggered,
  });
}
