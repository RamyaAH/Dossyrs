import { notFound } from "next/navigation";
import { requireEmployerSeat, requireEmployerAccessToSession } from "@/lib/auth/guards";
import { buildReplaySequence } from "@/lib/wse/scoring/replay";
import { DEBUG_INCIDENT_REPLAY_MAPPINGS } from "@/lib/wse/scenarios/debug-incident/replay";
import { ScoringReplay } from "@/components/employer/ScoringReplay";
import type { InputEvent } from "@/lib/wse/types";

export default async function EmployerScoringReplayPage({
  params,
}: {
  params: { assessmentId: string };
}) {
  const { supabase } = await requireEmployerSeat();

  const { data: session } = await supabase
    .from("wse_sessions")
    .select("id, assessment_id, status, candidate_id")
    .eq("assessment_id", params.assessmentId)
    .maybeSingle();

  // The concrete enforcement of "never live": refuse to render anything
  // for a session that isn't completed, not just a UI choice.
  if (!session || session.status !== "completed") {
    notFound();
  }

  await requireEmployerAccessToSession(session.id);

  const [{ data: candidate }, { data: dmcsScores }, { data: responses }] = await Promise.all([
    supabase
      .from("public_candidate_identity")
      .select("display_name")
      .eq("id", session.candidate_id)
      .maybeSingle(),
    supabase.from("dmcs_scores").select("dimension, band").eq("session_id", session.id),
    supabase
      .from("wse_scenario_responses")
      .select("scenario_slug, input_events")
      .eq("session_id", session.id),
  ]);

  const debugIncidentResponse = responses?.find((r) => r.scenario_slug === "debug-incident");
  const events = Array.isArray(debugIncidentResponse?.input_events)
    ? (debugIncidentResponse.input_events as InputEvent[])
    : [];

  const reveals = buildReplaySequence(events, DEBUG_INCIDENT_REPLAY_MAPPINGS);
  const bandByDimension = new Map((dmcsScores ?? []).map((s) => [s.dimension, s.band]));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold text-ink">Scoring replay</h1>
      <p className="mt-1 text-sm text-muted">
        {candidate?.display_name ?? "Candidate"} · {session.assessment_id}
      </p>
      <div className="mt-6">
        <ScoringReplay reveals={reveals} bandByDimension={bandByDimension} />
      </div>
    </main>
  );
}
