import { requireCandidate } from "@/lib/auth/guards";
import { CandidateSidebar } from "@/components/candidate/CandidateSidebar";

// Shared shell for the authenticated candidate pages (dashboard, prooffile,
// settings) - deliberately does NOT wrap login/signup (which must never sit
// behind an auth guard that redirects to itself) or assessment/** (which
// has its own full-bleed dark-workspace shell, not this sidebar).
export default async function CandidatePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { candidate } = await requireCandidate();

  return (
    <div className="flex min-h-screen">
      <CandidateSidebar displayName={candidate.display_name} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
