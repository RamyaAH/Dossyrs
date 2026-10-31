import { requireCandidate } from "@/lib/auth/guards";
import { ProfileForm } from "./ProfileForm";

export default async function CandidateSettingsPage() {
  const { supabase, candidate } = await requireCandidate();

  const { data: candidateLinks } = await supabase
    .from("candidates")
    .select("resume_url, portfolio_url")
    .eq("id", candidate.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold text-ink">Portfolio &amp; Resume</h1>
      <p className="mt-1 text-sm text-muted">
        Add or update the links that appear on your Prooffile.
      </p>
      <div className="mt-6">
        <ProfileForm
          initialResumeUrl={candidateLinks?.resume_url ?? null}
          initialPortfolioUrl={candidateLinks?.portfolio_url ?? null}
        />
      </div>
    </main>
  );
}
