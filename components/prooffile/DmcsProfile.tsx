import Link from "next/link";
import { DIMENSION_LABELS, type Band, type Dimension } from "@/lib/wse/types";

const BAND_PILL_CLASS: Record<Band, string> = {
  Developing: "band-pill-developing",
  Solid: "band-pill-solid",
  Strong: "band-pill-strong",
};

// Prooffile Block 2 — DMCS Profile.
export function DmcsProfile({
  scores,
}: {
  scores: { dimension: string; band: string }[];
}) {
  return (
    <div className="card flex flex-col gap-4">
      <span className="label-mono">Capability profile</span>
      <h2 className="text-lg text-ink">DMCS</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {scores.map((s) => (
          <div
            key={s.dimension}
            className="flex items-center justify-between rounded-xl border border-border bg-surface p-3.5"
          >
            <span className="text-sm text-ink">
              {DIMENSION_LABELS[s.dimension as Dimension] ?? s.dimension}
            </span>
            <span className={BAND_PILL_CLASS[s.band as Band] ?? "band-pill"}>
              <span className="dot bg-current" />
              {s.band}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        Bands reflect performance relative to other candidates in the same domain and tier.{" "}
        <Link href="/prooffile/how-it-works" className="font-medium text-brand hover:underline">
          How is this measured?
        </Link>
      </p>
    </div>
  );
}
