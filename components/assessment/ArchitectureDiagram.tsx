// Static, hand-authored reference diagram for the debug-incident
// scenario's Architecture tab - not a diagramming tool, just an inline
// SVG illustrating the notes in DEBUG_INCIDENT_ARCHITECTURE_NOTES. Uses
// the workspace-theme CSS variables directly (this only ever renders
// inside the dark assessment shell) so it stays legible without needing
// its own light/dark handling.
export function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 620 300" className="w-full" role="img" aria-label="OrderSync architecture diagram">
      <defs>
        <marker id="arch-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-muted)" />
        </marker>
      </defs>

      {/* Clients */}
      {[
        { x: 20, label: "acme-goods" },
        { x: 160, label: "nova-supply" },
        { x: 300, label: "meridian-retail", accent: true },
      ].map((c) => (
        <g key={c.label}>
          <rect
            x={c.x}
            y={10}
            width={130}
            height={34}
            rx={6}
            fill={c.accent ? "var(--color-accent-bg)" : "var(--color-surface-raised)"}
            stroke={c.accent ? "var(--color-accent)" : "var(--color-border)"}
          />
          <text x={c.x + 65} y={31} textAnchor="middle" fontSize="11" fill="var(--color-ink)">
            {c.label}
          </text>
        </g>
      ))}

      <line x1="215" y1="44" x2="215" y2="80" stroke="var(--color-muted)" markerEnd="url(#arch-arrow)" />

      {/* Gateway */}
      <rect x="115" y="82" width="200" height="34" rx="6" fill="var(--color-surface-raised)" stroke="var(--color-border)" />
      <text x="215" y="103" textAnchor="middle" fontSize="11" fill="var(--color-ink)">
        API Gateway (per-client rate limits)
      </text>

      <line x1="215" y1="116" x2="215" y2="152" stroke="var(--color-muted)" markerEnd="url(#arch-arrow)" />

      {/* OrderSync */}
      <rect x="115" y="154" width="200" height="34" rx="6" fill="var(--color-brand-bg)" stroke="var(--color-brand)" />
      <text x="215" y="175" textAnchor="middle" fontSize="11" fill="var(--color-ink)">
        OrderSync API
      </text>

      <line x1="215" y1="188" x2="215" y2="224" stroke="var(--color-muted)" markerEnd="url(#arch-arrow)" />

      {/* order-db pool */}
      <rect x="115" y="226" width="200" height="34" rx="6" fill="var(--color-surface-raised)" stroke="var(--color-border)" />
      <text x="215" y="247" textAnchor="middle" fontSize="11" fill="var(--color-ink)">
        order-db connection pool
      </text>

      {/* Shared consumers */}
      <g>
        <rect x="380" y="216" width="150" height="30" rx="6" fill="var(--color-surface-raised)" stroke="var(--color-border)" strokeDasharray="3 3" />
        <text x="455" y="235" textAnchor="middle" fontSize="10" fill="var(--color-muted)">
          Billing service
        </text>
        <line x1="380" y1="231" x2="317" y2="240" stroke="var(--color-muted)" strokeDasharray="3 3" />

        <rect x="380" y="252" width="150" height="30" rx="6" fill="var(--color-surface-raised)" stroke="var(--color-border)" strokeDasharray="3 3" />
        <text x="455" y="271" textAnchor="middle" fontSize="10" fill="var(--color-muted)">
          Notifications service
        </text>
        <line x1="380" y1="267" x2="317" y2="248" stroke="var(--color-muted)" strokeDasharray="3 3" />
      </g>

      <text x="215" y="292" textAnchor="middle" fontSize="9" fill="var(--color-muted)">
        Dashed = shares the pool, unrelated to today's deploy
      </text>
    </svg>
  );
}
