import Link from "next/link";
import { requireCandidate } from "@/lib/auth/guards";
import { CopyPublicLink } from "@/app/candidate/prooffile/CopyPublicLink";

export default async function CandidateDashboard() {
  const { supabase, candidate } = await requireCandidate();

  const { data: session } = await supabase
    .from("wse_sessions")
    .select("id, assessment_id, status, completed_at")
    .eq("candidate_id", candidate.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold text-ink">Welcome, {candidate.display_name}</h1>
      <p className="mt-1 text-sm text-muted">Logged in as {candidate.email}.</p>

      {!session && (
        <div className="card mt-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink">Get your verified capability profile</h2>
          <p className="text-sm text-muted">
            Complete a short set of realistic engineering scenarios to generate your Prooffile.
          </p>
          <Link href="/candidate/assessment" className="btn-primary self-start">
            Start assessment
          </Link>
        </div>
      )}

      {session?.status === "in_progress" && (
        <div className="card mt-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink">Your assessment is in progress</h2>
          <p className="text-sm text-muted">Pick up where you left off.</p>
          <Link href="/candidate/assessment" className="btn-primary self-start">
            Resume assessment
          </Link>
        </div>
      )}

      {session?.status === "completed" && (
        <div className="card mt-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink">Your Prooffile is ready</h2>
          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center gap-2">
              <dt className="label-mono">Assessment ID</dt>
              <dd className="font-mono text-ink">{session.assessment_id}</dd>
            </div>
            {session.completed_at && (
              <div className="flex items-center gap-2">
                <dt className="label-mono">Completed</dt>
                <dd className="text-ink">{new Date(session.completed_at).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
          <div className="flex flex-wrap gap-3">
            <Link href="/candidate/prooffile" className="btn-primary">
              View your Prooffile
            </Link>
            <CopyPublicLink assessmentId={session.assessment_id} />
          </div>
        </div>
      )}
    </main>
  );
}
