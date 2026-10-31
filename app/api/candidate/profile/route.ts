import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only ever writes resume_url/portfolio_url - never email or display_name,
// which the DB trigger in 0013 rejects outright regardless of what this
// route sends. Updates via the request-scoped client (not a service-role
// client), so RLS's "candidate update own row" policy is the real
// enforcement boundary here, not this route's own field allowlist alone.
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { resumeUrl, portfolioUrl } = body as { resumeUrl?: string; portfolioUrl?: string };

  const { error } = await supabase
    .from("candidates")
    .update({
      resume_url: resumeUrl?.trim() || null,
      portfolio_url: portfolioUrl?.trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
