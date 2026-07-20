import type { SupabaseClient } from "@supabase/supabase-js";
import { SCENARIO_REGISTRY } from "@/lib/wse/scenarios/registry";
import { computeDmcsScores } from "@/lib/wse/scoring";
import { computeCiqSignals } from "@/lib/wse/ciq";
import type { InputEvent } from "@/lib/wse/types";

export type CompleteSessionResult = { ok: true } | { ok: false; error: string; status: number };

// Shared by both the API route (app/api/wse/sessions/[id]/complete) and the
// complete page (which calls this directly server-side rather than
// round-tripping to its own API) so the idempotent completion logic lives
// in exactly one place. Safe to call again if a previous call completed the
// session but failed partway through CIQ/DMCS insertion.
export async function completeSession(
  supabase: SupabaseClient,
  sessionId: string,
  candidateId: string
): Promise<CompleteSessionResult> {
  const { data: session } = await supabase
    .from("wse_sessions")
    .select("id, candidate_id, status, started_at, completed_at")
    .eq("id", sessionId)
    .single();

  if (!session || session.candidate_id !== candidateId) {
    return { ok: false, error: "Session not found", status: 404 };
  }

  const { data: responses } = await supabase
    .from("wse_scenario_responses")
    .select(
      "scenario_slug, scenario_version, response_payload, input_events, submitted_at, duration_seconds"
    )
    .eq("session_id", sessionId);

  const submittedSlugs = new Set(
    (responses ?? []).filter((r) => r.submitted_at).map((r) => r.scenario_slug)
  );
  const allSubmitted = SCENARIO_REGISTRY.every((s) => submittedSlugs.has(s.slug));

  if (!allSubmitted) {
    return { ok: false, error: "Not all scenarios submitted yet", status: 400 };
  }

  let completedAt = session.completed_at;

  if (session.status !== "completed") {
    const now = new Date();
    const startedAt = new Date(session.started_at);
    const durationSeconds = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000));

    const { error: completeError } = await supabase
      .from("wse_sessions")
      .update({
        status: "completed",
        completed_at: now.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq("id", sessionId);

    if (completeError) {
      return { ok: false, error: completeError.message, status: 500 };
    }
    completedAt = now.toISOString();
  }

  const { data: existingCiq } = await supabase
    .from("ciq_signals")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!existingCiq) {
    const totalSessionDurationSeconds = Math.max(
      0,
      Math.round(
        (new Date(completedAt as string).getTime() - new Date(session.started_at).getTime()) /
          1000
      )
    );

    const ciqInput = (responses ?? []).map((r) => ({
      scenarioSlug: r.scenario_slug,
      durationSeconds: r.duration_seconds,
      responsePayload: r.response_payload,
      events: Array.isArray(r.input_events) ? (r.input_events as InputEvent[]) : [],
    }));

    const ciq = computeCiqSignals({ totalSessionDurationSeconds, responses: ciqInput });

    const { error: ciqError } = await supabase.from("ciq_signals").insert({
      session_id: sessionId,
      status: ciq.status,
      timing_anomaly: ciq.timingAnomaly,
      timing_detail: ciq.timingDetail,
      paste_detected: ciq.pasteDetected,
      paste_detail: ciq.pasteDetail,
      duplicate_answer_detected: ciq.duplicateAnswerDetected,
      duplicate_detail: ciq.duplicateDetail,
    });

    if (ciqError) {
      return { ok: false, error: ciqError.message, status: 500 };
    }
  }

  const { data: existingDmcs } = await supabase
    .from("dmcs_scores")
    .select("id")
    .eq("session_id", sessionId);

  if (!existingDmcs || existingDmcs.length === 0) {
    const scoreInput = (responses ?? []).map((r) => ({
      scenario_slug: r.scenario_slug,
      scenario_version: r.scenario_version,
      response_payload: r.response_payload,
      input_events: r.input_events,
    }));

    const dmcsRows = computeDmcsScores(scoreInput);

    const { error: dmcsError } = await supabase.from("dmcs_scores").insert(
      dmcsRows.map((row) => ({
        session_id: sessionId,
        dimension: row.dimension,
        raw_score: row.raw_score,
        band: row.band,
        contributing_scenarios: row.contributing_scenarios,
      }))
    );

    if (dmcsError) {
      return { ok: false, error: dmcsError.message, status: 500 };
    }
  }

  return { ok: true };
}
