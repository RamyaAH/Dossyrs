import { redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth/guards";
import { SCENARIO_REGISTRY } from "@/lib/wse/scenarios/registry";
import { StartAssessmentButton } from "./StartAssessmentButton";

export default async function AssessmentEntryPage() {
  const { supabase, candidate } = await requireCandidate();

  const { data: sessions } = await supabase
    .from("wse_sessions")
    .select("id, status")
    .eq("candidate_id", candidate.id)
    .order("created_at", { ascending: false });

  const completed = sessions?.find((s) => s.status === "completed");
  if (completed) {
    redirect("/candidate/prooffile");
  }

  const inProgress = sessions?.find((s) => s.status === "in_progress");
  if (inProgress) {
    const { data: responses } = await supabase
      .from("wse_scenario_responses")
      .select("scenario_slug, submitted_at")
      .eq("session_id", inProgress.id);

    const submittedSlugs = new Set(
      (responses ?? []).filter((r) => r.submitted_at).map((r) => r.scenario_slug)
    );
    const nextScenario = SCENARIO_REGISTRY.find((s) => !submittedSlugs.has(s.slug));

    if (nextScenario) {
      redirect(`/candidate/assessment/${inProgress.id}/scenario/${nextScenario.slug}`);
    }
    // Every scenario submitted but the session was never marked complete
    // (candidate got interrupted before reaching the complete page).
    redirect(`/candidate/assessment/${inProgress.id}/complete`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold text-ink">Start your Dossyr assessment</h1>
      <p className="text-sm text-muted">
        You&apos;ll work through {SCENARIO_REGISTRY.length} realistic engineering scenarios. Your
        answers produce a verified capability profile you can share with employers.
      </p>
      <StartAssessmentButton />
    </main>
  );
}
