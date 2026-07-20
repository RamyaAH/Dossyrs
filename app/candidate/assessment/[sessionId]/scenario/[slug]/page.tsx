import { notFound, redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth/guards";
import { SCENARIO_REGISTRY, getScenarioDefinition } from "@/lib/wse/scenarios/registry";
import { ScenarioClient } from "./ScenarioClient";

export default async function ScenarioPage({
  params,
}: {
  params: { sessionId: string; slug: string };
}) {
  const { supabase, candidate } = await requireCandidate();

  const definition = getScenarioDefinition(params.slug);
  if (!definition) notFound();

  const { data: session } = await supabase
    .from("wse_sessions")
    .select("id, candidate_id, status")
    .eq("id", params.sessionId)
    .single();

  if (!session || session.candidate_id !== candidate.id) notFound();

  if (session.status === "completed") {
    redirect("/candidate/prooffile");
  }

  const index = SCENARIO_REGISTRY.findIndex((s) => s.slug === params.slug);
  const progressLabel = `Scenario ${index + 1} of ${SCENARIO_REGISTRY.length}`;
  const nextSlug = SCENARIO_REGISTRY[index + 1]?.slug ?? null;

  return (
    <ScenarioClient
      sessionId={params.sessionId}
      slug={params.slug}
      progressLabel={progressLabel}
      nextSlug={nextSlug}
    />
  );
}
