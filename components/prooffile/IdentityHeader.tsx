import { domainLabel, tierLabel } from "@/lib/wse/types";

// Prooffile Block 1 — Verified Identity Header.
export function IdentityHeader({
  displayName,
  domain,
  tier,
  completedAt,
}: {
  displayName: string;
  domain: string;
  tier: string;
  completedAt: string | null;
}) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-ink">{displayName}</h2>
        <p className="text-sm text-muted">
          {domainLabel(domain)} · {tierLabel(tier)}
        </p>
      </div>
      {completedAt && (
        <p className="text-xs text-muted">
          Assessed {new Date(completedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
