import { notFound } from "next/navigation";
import { requireEmployerSeat, requireEmployerAccessToSession } from "@/lib/auth/guards";
import { buildReplaySequence } from "@/lib/wse/scoring/replay";
import { REPLAY_MAPPINGS_BY_SLUG } from "@/lib/wse/scoring/replayRegistry";
import { getScenarioDefinition } from "@/lib/wse/scenarios/registry";
import { ScoringReplay } from "@/components/employer/ScoringReplay";
import type { InputEvent, ScenarioSlug } from "@/lib/wse/types";

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

  // Session-level aggregate (weighted across every contributing scenario),
  // not per-scenario - reused unchanged across every section below.
  const bandByDimension = new Map((dmcsScores ?? []).map((s) => [s.dimension, s.band]));

  const sections = (responses ?? [])
    .map((r) => {
      const mappings = REPLAY_MAPPINGS_BY_SLUG[r.scenario_slug as ScenarioSlug];
      if (!mappings) return null; // scenario has no replay mappings yet - skip, don't error
      const events = Array.isArray(r.input_events) ? (r.input_events as InputEvent[]) : [];
      const reveals = buildReplaySequence(events, mappings);
      const title = getScenarioDefinition(r.scenario_slug)?.title ?? r.scenario_slug;
      return { slug: r.scenario_slug, title, reveals };
    })
    .filter((s): s is { slug: string; title: string; reveals: ReturnType<typeof buildReplaySequence> } => s !== null);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold text-ink">Scoring replay</h1>
      <p className="mt-1 text-sm text-muted">
        {candidate?.display_name ?? "Candidate"} · {session.assessment_id}
      </p>
      <div className="mt-6 flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.slug} className="flex flex-col gap-2">
            <h2 className="label-mono">{section.title}</h2>
            <ScoringReplay reveals={section.reveals} bandByDimension={bandByDimension} />
          </div>
        ))}
      </div>
    </main>
  );
}
