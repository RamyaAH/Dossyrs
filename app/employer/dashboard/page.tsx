import { requireEmployerSeat } from "@/lib/auth/guards";

export default async function EmployerDashboard() {
  const { seat } = await requireEmployerSeat();

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>
        Welcome, {seat.display_name}
      </h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        {seat.employers?.company_name} · {seat.seat_type} seat
      </p>
      <p style={{ color: "#666", marginTop: 8 }}>
        This is a placeholder — the real employer dashboard (Roles, Discovery,
        Pipeline, Signals) gets built in Phase 3.
      </p>
    </main>
  );
}
