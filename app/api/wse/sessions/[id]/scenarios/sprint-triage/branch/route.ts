import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnedInProgressSession } from "@/lib/wse/sessionGuards";
import { resolveBranch, type BeatId } from "@/lib/wse/scenarios/sprint-triage/branch";

const SLUG = "sprint-triage";

interface BranchState {
  currentBeatId: BeatId;
}

function parseBranchState(raw: unknown): BranchState {
  if (raw && typeof raw === "object" && "currentBeatId" in raw) {
    const s = raw as Partial<BranchState>;
    return { currentBeatId: (s.currentBeatId as BeatId) ?? "pushback" };
  }
  return { currentBeatId: "pushback" };
}

// Same shape as debug-incident's branch route: client claims a beat +
// choice, server verifies that matches its own stored state before acting
// on it, rejecting stale/forged replays.
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
  const { beatId, action } = body as { beatId?: string; action?: string };
  if (!beatId || !action) {
    return NextResponse.json({ error: "Missing beatId or action" }, { status: 400 });
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

  const state = parseBranchState(existing.branch_state);
  if (state.currentBeatId !== beatId) {
    return NextResponse.json({ error: "Stale beat — refresh and try again" }, { status: 409 });
  }

  const result = resolveBranch(state.currentBeatId, action as "held" | "changed");
  if (!result) {
    return NextResponse.json({ error: "Invalid beat or action" }, { status: 400 });
  }

  const nextState: BranchState = { currentBeatId: result.nextBeatId };

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
  });
}
