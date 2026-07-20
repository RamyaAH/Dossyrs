import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAssessmentId } from "@/lib/wse/assessmentId";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Reuse an existing in-progress session rather than creating a second one
  // - the partial unique index on wse_sessions also enforces this at the DB
  // layer, this just avoids hitting that constraint in the common case.
  const { data: existing } = await supabase
    .from("wse_sessions")
    .select("id")
    .eq("candidate_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ id: existing.id });
  }

  const { data: session, error } = await supabase
    .from("wse_sessions")
    .insert({ candidate_id: user.id, assessment_id: generateAssessmentId() })
    .select("id")
    .single();

  if (error || !session) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: session.id });
}
