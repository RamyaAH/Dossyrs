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
