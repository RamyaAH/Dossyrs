import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnedInProgressSession } from "@/lib/wse/sessionGuards";
import { resolvePmAnswers } from "@/lib/wse/scenarios/ambiguous-request/branch";

const SLUG = "ambiguous-request";

interface BranchState {
  askedTheRoom: boolean;
  askedQuestionIds: string[];
}

function parseBranchState(raw: unknown): BranchState {
  if (raw && typeof raw === "object" && "askedTheRoom" in raw) {
    const s = raw as Partial<BranchState>;
    return {
      askedTheRoom: Boolean(s.askedTheRoom),
      askedQuestionIds: Array.isArray(s.askedQuestionIds) ? s.askedQuestionIds : [],
    };
  }
  return { askedTheRoom: false, askedQuestionIds: [] };
}

// Single round trip, but the server-side "already asked" lock below is
// load-bearing, not a nicety: without it, a candidate could check every
// question, see which get the "already covered" redirect, then uncheck
// exactly those before final submit - laundering a reading-comprehension
// failure (selecting decoy questions) into a perfect scoreIS. The client
// also disables the checkboxes after a successful response, but that's
// defense in depth - this check is what actually closes the gap, same
// division of labor as every other server-authoritative check in this app.
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
  const { selectedQuestionIds } = body as { selectedQuestionIds?: unknown };
  if (!Array.isArray(selectedQuestionIds) || selectedQuestionIds.length === 0) {
    return NextResponse.json({ error: "No questions selected" }, { status: 400 });
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
  if (state.askedTheRoom) {
    return NextResponse.json({ error: "Already asked the room" }, { status: 409 });
  }

  const questionIds = selectedQuestionIds.filter((id): id is string => typeof id === "string");
  const personaMessages = resolvePmAnswers(questionIds);

  const nextState: BranchState = { askedTheRoom: true, askedQuestionIds: questionIds };

  const { error } = await supabase
    .from("wse_scenario_responses")
    .update({ branch_state: nextState })
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ personaMessages });
}
