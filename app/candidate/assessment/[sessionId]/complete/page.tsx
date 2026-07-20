import { redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth/guards";
import { completeSession } from "@/lib/wse/completeSession";

export default async function AssessmentCompletePage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { supabase, candidate } = await requireCandidate();

  const result = await completeSession(supabase, params.sessionId, candidate.id);

  if (!result.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
        <p className="text-sm text-muted">{result.error}</p>
      </main>
    );
  }

  redirect("/candidate/prooffile");
}
