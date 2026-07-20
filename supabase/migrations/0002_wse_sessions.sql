create table if not exists wse_sessions (
  id uuid primary key default gen_random_uuid(),
  assessment_id text not null unique,
  candidate_id uuid not null references candidates(id) on delete cascade,
  domain text not null default 'software_engineering',
  tier text not null default 'tier2_fixed',
  wse_version text not null default 'wse-mvp-1.0',
  dmcs_version text not null default 'dmcs-mvp-1.0',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

-- Enforces one non-completed session per candidate at a time (no retakes yet
-- — a deliberate MVP simplification).
create unique index if not exists wse_sessions_one_active_per_candidate
  on wse_sessions (candidate_id)
  where status <> 'completed';
