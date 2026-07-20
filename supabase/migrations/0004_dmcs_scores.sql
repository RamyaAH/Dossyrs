-- Append-only: one row per session per dimension, ever. No UPDATE/DELETE
-- policy is granted in 0006, so this is enforced at the RLS layer, not just
-- by convention here.
create table if not exists dmcs_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references wse_sessions(id) on delete cascade,
  dimension text not null check (dimension in ('TAI', 'PR', 'IS', 'SA', 'LAM')),
  raw_score numeric not null,
  band text not null check (band in ('Developing', 'Solid', 'Strong')),
  rubric_version text not null default 'rubric-mvp-1.0',
  contributing_scenarios jsonb not null,
  computed_at timestamptz not null default now(),
  unique (session_id, dimension)
);
