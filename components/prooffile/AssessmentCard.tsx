import {
  DIMENSION_LABELS,
  SCENARIO_FAMILY_LABELS,
  domainLabel,
  tierLabel,
  type CiqStatus,
} from "@/lib/wse/types";
import { SCENARIO_REGISTRY } from "@/lib/wse/scenarios/registry";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

const CIQ_LABELS: Record<CiqStatus, string> = {
  clean: "Clean",
  review: "Review",
};

const CIQ_PILL_CLASS: Record<CiqStatus, string> = {
  clean: "ciq-pill-clean",
  review: "ciq-pill-review",
};

// Prooffile Block 3 — DMCS Assessment Card. Family/dimension coverage is
// computed from the scenario registry (every scenario a candidate
// completes), so this stays accurate as scenarios are added, rather than
// being hardcoded to what exists today.
export function AssessmentCard({
  domain,
  tier,
  completedAt,
  durationSeconds,
  ciqStatus,
  wseVersion,
  dmcsVersion,
  assessmentId,
}: {
  domain: string;
  tier: string;
  completedAt: string | null;
  durationSeconds: number | null;
  ciqStatus: string | null;
  wseVersion: string;
  dmcsVersion: string;
  assessmentId: string;
}) {
  const coveredFamilies = new Set<string>(SCENARIO_REGISTRY.flatMap((s) => s.families));
  const coveredDimensions = new Set<string>(
    SCENARIO_REGISTRY.flatMap((s) => Object.keys(s.dimensionWeights))
  );

  const ciq = ciqStatus === "clean" || ciqStatus === "review" ? (ciqStatus as CiqStatus) : null;

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-ink">Assessment card</h2>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted">Domain</dt>
          <dd className="text-ink">{domainLabel(domain)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Tier</dt>
          <dd className="text-ink">{tierLabel(tier)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Completed</dt>
          <dd className="text-ink">
            {completedAt ? new Date(completedAt).toLocaleDateString() : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Duration</dt>
          <dd className="text-ink">{formatDuration(durationSeconds)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Integrity status (CIQ)</dt>
          <dd>
            {ciq ? (
              <span className={CIQ_PILL_CLASS[ciq]}>{CIQ_LABELS[ciq]}</span>
            ) : (
              <span className="text-ink">—</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Assessment ID</dt>
          <dd className="font-mono text-xs text-ink">{assessmentId}</dd>
        </div>
      </dl>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Scenario coverage
        </h3>
        <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          {Object.entries(SCENARIO_FAMILY_LABELS).map(([key, label]) => (
            <li key={key} className="flex items-center gap-2 text-ink">
              <span className={coveredFamilies.has(key) ? "text-success" : "text-muted"}>
                {coveredFamilies.has(key) ? "✓" : "—"}
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Dimensions covered
        </h3>
        <ul className="flex flex-wrap gap-2 text-xs">
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
            <li
              key={key}
              className={`rounded-full border px-2.5 py-1 ${
                coveredDimensions.has(key)
                  ? "border-brand-bg bg-brand-bg text-brand-dark"
                  : "border-border text-muted"
              }`}
            >
              {key} · {label}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted">
        WSE {wseVersion} · DMCS {dmcsVersion}
      </p>
    </div>
  );
}
