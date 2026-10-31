"use client";

import { useState } from "react";
import {
  CLOUD_CONSOLE_ERROR_METRICS,
  CLOUD_CONSOLE_RDS_INSTANCE,
} from "@/lib/wse/scenarios/debug-incident/cloudConsoleContent";

type Page = "rds" | "metrics";

function RdsPage() {
  const i = CLOUD_CONSOLE_RDS_INSTANCE;
  const rows: [string, string | number][] = [
    ["Instance ID", i.instanceId],
    ["Engine", i.engine],
    ["Instance class", i.instanceClass],
    ["Region", i.region],
    ["Max connections (instance ceiling)", i.maxConnections],
    ["Reserved for other services sharing this instance", i.reservedForOtherServices],
    ["App connection pool size (current)", i.currentAppPoolSize],
  ];
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
          <dt className="text-muted">{label}</dt>
          <dd className="text-right font-mono text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MetricsPage() {
  const max = Math.max(...CLOUD_CONSOLE_ERROR_METRICS.map((m) => m.value));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        order-db · connection-pool-exhaustion errors, client=meridian-retail, per minute
      </p>
      <svg viewBox="0 0 300 140" className="w-full max-w-sm">
        {CLOUD_CONSOLE_ERROR_METRICS.map((m, i) => {
          const barWidth = 60;
          const gap = 30;
          const x = 20 + i * (barWidth + gap);
          const barHeight = (m.value / max) * 90;
          const y = 110 - barHeight;
          return (
            <g key={m.label}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={3} fill="var(--color-danger)" opacity={0.7} />
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="var(--color-ink)">
                {m.value}
              </text>
              <text x={x + barWidth / 2} y={126} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Mocked, minimal multi-page cloud-resources console - own generic
// branding, not a real API integration (there's nothing real to
// integrate with for a fictional company). Reference-only, same as the
// tab it replaces: not a scored evidence surface, investigative scoring
// signal stays concentrated in log search / diff / SQL.
export function CloudConsolePane() {
  const [page, setPage] = useState<Page>("rds");

  return (
    <div className="grid grid-cols-[120px_1fr] gap-4">
      <div className="flex flex-col gap-0.5">
        {(
          [
            ["rds", "Database"],
            ["metrics", "Metrics"],
          ] as [Page, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPage(id)}
            className={`rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
              page === id ? "bg-brand-bg text-brand" : "text-muted hover:bg-surface-raised hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div>{page === "rds" ? <RdsPage /> : <MetricsPage />}</div>
    </div>
  );
}
