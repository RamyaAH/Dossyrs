import { requireEmployerSeat } from "@/lib/auth/guards";

export default async function EmployerDashboard() {
  const { seat } = await requireEmployerSeat();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl text-ink">Welcome, {seat.display_name}</h1>
      <p className="mt-1 text-sm text-muted">
        {seat.employers?.company_name} · {seat.seat_type} seat
      </p>

      <div className="card mt-6 flex flex-col gap-2">
        <span className="label-mono">Coming next</span>
        <p className="text-sm text-ink">
          Roles, Discovery, Pipeline, and Signals are a separate build phase — this dashboard is a
          placeholder until then.
        </p>
      </div>
    </main>
  );
}
