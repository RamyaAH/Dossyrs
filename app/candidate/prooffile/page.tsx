import { redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth/guards";
import { IdentityHeader } from "@/components/prooffile/IdentityHeader";
import { DmcsProfile } from "@/components/prooffile/DmcsProfile";
import { AssessmentCard } from "@/components/prooffile/AssessmentCard";
import { CopyPublicLink } from "./CopyPublicLink";

export default async function MyProoffilePage() {
  const { supabase, candidate } = await requireCandidate();

  const { data: session } = await supabase
    .from("wse_sessions")
    .select(
      "id, assessment_id, domain, tier, wse_version, dmcs_version, completed_at, duration_seconds"
    )
    .eq("candidate_id", candidate.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    redirect("/candidate/assessment");
  }

  const [{ data: dmcsScores }, { data: ciq }] = await Promise.all([
    supabase.from("dmcs_scores").select("dimension, band").eq("session_id", session.id),
    supabase.from("ciq_signals").select("status").eq("session_id", session.id).maybeSingle(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Your Prooffile</h1>
        <CopyPublicLink assessmentId={session.assessment_id} />
      </div>
      <div className="flex flex-col gap-6">
        <IdentityHeader
          displayName={candidate.display_name}
          domain={session.domain}
          tier={session.tier}
          completedAt={session.completed_at}
        />
        <DmcsProfile scores={dmcsScores ?? []} />
        <AssessmentCard
          domain={session.domain}
          tier={session.tier}
          completedAt={session.completed_at}
          durationSeconds={session.duration_seconds}
          ciqStatus={ciq?.status ?? null}
          wseVersion={session.wse_version}
          dmcsVersion={session.dmcs_version}
          assessmentId={session.assessment_id}
        />
      </div>
    </main>
  );
}
