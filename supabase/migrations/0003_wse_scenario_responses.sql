create table if not exists wse_scenario_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references wse_sessions(id) on delete cascade,
  scenario_slug text not null,
  scenario_version text not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  duration_seconds integer,
  response_payload jsonb not null default '{}'::jsonb,
  input_events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, scenario_slug)
);

create index if not exists wse_scenario_responses_session_id_idx on wse_scenario_responses (session_id);
