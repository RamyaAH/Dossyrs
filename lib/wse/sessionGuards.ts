import type { SupabaseClient } from "@supabase/supabase-js";

// Shared by every WSE route handler that mutates scenario-response state
// (scenario start/submit, and the branch-resolution route) - one ownership
// check, not one per route. RLS is the real enforcement boundary; this is a
// defense-in-depth duplicate, same as the rest of this codebase's routes.
export async function getOwnedInProgressSession(
  supabase: SupabaseClient,
  sessionId: string,
  candidateId: string
) {
  const { data } = await supabase
    .from("wse_sessions")
    .select("id, candidate_id, status")
    .eq("id", sessionId)
    .single();

  if (!data || data.candidate_id !== candidateId) return null;
  return data;
}
