import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmployerDashboard() {
  const supabase = createClient();
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
    .single();

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>
        Welcome, {seat?.display_name ?? "there"}
      </h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        {/* @ts-expect-error - employers is a joined object, not an array, at runtime */}
        {seat?.employers?.company_name} · {seat?.seat_type} seat
      </p>
      <p style={{ color: "#666", marginTop: 8 }}>
        This is a placeholder — the real employer dashboard (Roles, Discovery,
        Pipeline, Signals) gets built in Phase 3.
      </p>
    </main>
  );
}
