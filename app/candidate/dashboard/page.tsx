import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CandidateDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/candidate/login");
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>
        Welcome, {candidate?.display_name ?? "candidate"}
      </h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        Logged in as {candidate?.email}. This is a placeholder — the real
        candidate dashboard (WSE simulation entry, Prooffile, Signals) gets
        built in Phase 2.
      </p>
    </main>
  );
}
