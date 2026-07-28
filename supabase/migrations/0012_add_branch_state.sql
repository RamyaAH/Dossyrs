-- Server-authoritative state for the debug-incident scenario's war-room
-- branching engine (which persona reaction the candidate has actually been
-- shown, keyed off their real choices - never trust the client's claimed
-- position). Additive, nullable-safe default; no backfill needed since no
-- rows have branching data yet.
alter table wse_scenario_responses
  add column if not exists branch_state jsonb not null default '{}'::jsonb;
