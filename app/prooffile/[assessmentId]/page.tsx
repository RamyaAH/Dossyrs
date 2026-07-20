import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IdentityHeader } from "@/components/prooffile/IdentityHeader";
import { DmcsProfile } from "@/components/prooffile/DmcsProfile";
import { AssessmentCard } from "@/components/prooffile/AssessmentCard";

export default async function PublicProoffilePage({
  params,
}: {
  params: { assessmentId: string };
}) {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("wse_sessions")
    .select(
      "id, candidate_id, assessment_id, domain, tier, wse_version, dmcs_version, completed_at, duration_seconds, status"
    )
    .eq("assessment_id", params.assessmentId)
    .eq("status", "completed")
    .maybeSingle();

  if (!session) notFound();

  const [{ data: candidate }, { data: dmcsScores }, { data: ciq }] = await Promise.all([
    supabase
      .from("public_candidate_identity")
      .select("display_name")
      .eq("id", session.candidate_id)
      .maybeSingle(),
    supabase.from("dmcs_scores").select("dimension, band").eq("session_id", session.id),
    supabase.from("public_ciq_status").select("status").eq("session_id", session.id).maybeSingle(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-xl font-semibold text-ink">Verified Prooffile</h1>
      <div className="flex flex-col gap-6">
        <IdentityHeader
          displayName={candidate?.display_name ?? "Candidate"}
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
