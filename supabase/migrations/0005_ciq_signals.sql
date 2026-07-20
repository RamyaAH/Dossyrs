-- Append-only: one row per session, ever. No UPDATE/DELETE policy is granted
-- in 0006, so this is enforced at the RLS layer, not just by convention here.
create table if not exists ciq_signals (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references wse_sessions(id) on delete cascade unique,
  status text not null check (status in ('clean', 'review')),
  timing_anomaly boolean not null default false,
  timing_detail jsonb,
  paste_detected boolean not null default false,
  paste_detail jsonb,
  duplicate_answer_detected boolean not null default false,
  duplicate_detail jsonb,
  ciq_version text not null default 'ciq-mvp-1.0',
  computed_at timestamptz not null default now()
);
