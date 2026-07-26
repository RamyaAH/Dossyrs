import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Shared server-side guards for candidate/employer pages. Each does the
// "is anyone logged in" check every page already did, plus the check that
// was missing before: does a matching profile row actually exist for this
// user in *this* portal. Without that second check, a candidate-only user
// hitting /employer/dashboard (or vice versa) rendered with blank/undefined
// fields instead of being redirected anywhere sensible.

export type CandidateProfile = {
  id: string;
  display_name: string;
  email: string;
};

export type EmployerSeatProfile = {
  display_name: string;
  seat_type: string;
  employer_id: string;
  employers: { company_name: string } | null;
};

export async function requireCandidate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/candidate/login");
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, display_name, email")
    .eq("id", user.id)
    .single<CandidateProfile>();

  if (!candidate) {
    // Not a candidate. If they're actually an employer, send them to the
    // portal that matches their account instead of rendering blank data.
    const { data: seat } = await supabase
      .from("employer_seats")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    redirect(seat ? "/employer/dashboard" : "/");
  }

  return { supabase, user, candidate };
}

export async function requireEmployerSeat() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/employer/login");
  }

  const { data: seat } = await supabase
    .from("employer_seats")
    .select("display_name, seat_type, employer_id, employers(company_name)")
    .eq("user_id", user.id)
    .single<EmployerSeatProfile>();

  if (!seat) {
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    redirect(candidate ? "/candidate/dashboard" : "/");
  }

  return { supabase, user, seat };
}

// Access model for now: any authenticated employer seat, gated only by
// knowing the specific session's assessment ID - the same trust model the
// public Prooffile link already uses, just behind an employer-login wall
// too. There's no "employer X may view candidate Y" relationship yet
// (Pipeline/Discovery isn't built). Kept as its own function, taking the
// session id, so tightening this to a real relationship check later is a
// single-function change rather than touching every call site.
export async function requireEmployerAccessToSession(_sessionId: string) {
  return requireEmployerSeat();
}
