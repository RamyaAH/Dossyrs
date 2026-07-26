import { DIMENSION_LABELS, type Band, type Dimension } from "@/lib/wse/types";
import type { DimensionReveal } from "@/lib/wse/scoring/replay";

const BAND_PILL_CLASS: Record<Band, string> = {
  Developing: "band-pill-developing",
  Solid: "band-pill-solid",
  Strong: "band-pill-strong",
};

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Discrete, honest step-reveals - never a fabricated smooth/animated fill.
// Each dimension's contribution appears at the real timestamp it became
// knowable, not before. Employer-only, post-completion; the caller (the
// replay route) is responsible for never rendering this for a session
// that isn't status = 'completed'.
export function ScoringReplay({
  reveals,
  bandByDimension,
}: {
  reveals: DimensionReveal[];
  bandByDimension: Map<string, string>;
}) {
  return (
    <div className="card flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-ink">How the score built up</h2>
      <ol className="flex flex-col gap-3">
        {reveals.map((reveal) => {
          const band = bandByDimension.get(reveal.dimension);
          return (
            <li
              key={reveal.dimension}
              className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
            >
              <div>
                <div className="text-sm font-medium text-ink">
                  {DIMENSION_LABELS[reveal.dimension as Dimension] ?? reveal.dimension}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {reveal.contributingEvents.map((e) => e.label).join(" · ")}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {band && (
                  <span className={BAND_PILL_CLASS[band as Band] ?? "band-pill"}>{band}</span>
                )}
                <span className="label-mono">{formatTime(reveal.revealedAt)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
