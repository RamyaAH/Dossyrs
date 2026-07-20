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
        <span className="label-mono mb-1 inline-flex items-center gap-1.5">
          <span className="dot bg-brand" />
          Verified
        </span>
        <h2 className="text-2xl text-ink">{displayName}</h2>
        <p className="text-sm text-muted">
          {domainLabel(domain)} · {tierLabel(tier)}
        </p>
      </div>
      {completedAt && (
        <p className="label-mono">Assessed {new Date(completedAt).toLocaleDateString()}</p>
      )}
    </div>
  );
}
