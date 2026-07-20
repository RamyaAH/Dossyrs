import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getScenarioDefinition } from "@/lib/wse/scenarios/registry";

async function getOwnedInProgressSession(
  supabase: SupabaseClient,
  sessionId: string,
  candidateId: string
) {
  const { data } = await supabase
    .from("wse_sessions")
    .select("id, candidate_id, status")
    .eq("id", sessionId)
    .single();

  if (!data || data.candidate_id !== candidateId) return null;
  return data;
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string; slug: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const definition = getScenarioDefinition(params.slug);
  if (!definition) return NextResponse.json({ error: "Unknown scenario" }, { status: 404 });

  const session = await getOwnedInProgressSession(supabase, params.id, user.id);
  if (!session || session.status !== "in_progress") {
    return NextResponse.json({ error: "Session not available" }, { status: 404 });
  }

  // Idempotent "start" stamp: the unique (session_id, scenario_slug)
  // constraint means a repeat call (e.g. remount/refresh) just hits
  // 23505 (unique_violation), which we swallow.
  const { error } = await supabase.from("wse_scenario_responses").insert({
    session_id: params.id,
    scenario_slug: params.slug,
    scenario_version: definition.version,
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; slug: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const definition = getScenarioDefinition(params.slug);
  if (!definition) return NextResponse.json({ error: "Unknown scenario" }, { status: 404 });

  const session = await getOwnedInProgressSession(supabase, params.id, user.id);
  if (!session || session.status !== "in_progress") {
    return NextResponse.json({ error: "Session not available" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { responsePayload, inputEvents } = body as {
    responsePayload?: unknown;
    inputEvents?: unknown;
  };

  const { data: existing } = await supabase
    .from("wse_scenario_responses")
    .select("id, started_at, submitted_at")
    .eq("session_id", params.id)
    .eq("scenario_slug", params.slug)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Scenario not started" }, { status: 400 });
  }
  if (existing.submitted_at) {
    return NextResponse.json({ error: "Scenario already submitted" }, { status: 409 });
  }

  const now = new Date();
  const startedAt = new Date(existing.started_at);
  const durationSeconds = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000));

  const { error } = await supabase
    .from("wse_scenario_responses")
    .update({
      response_payload: responsePayload ?? {},
      input_events: inputEvents ?? [],
      submitted_at: now.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
