alter table wse_sessions enable row level security;
alter table wse_scenario_responses enable row level security;
alter table dmcs_scores enable row level security;
alter table ciq_signals enable row level security;

-- wse_sessions ----------------------------------------------------------

do $$ begin
  create policy "candidate select own sessions" on wse_sessions for select
    using (auth.uid() = candidate_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "candidate insert own sessions" on wse_sessions for insert
    with check (auth.uid() = candidate_id);
exception when duplicate_object then null; end $$;

-- Allows the in_progress -> completed transition. The immutability trigger
-- in 0007 blocks any update once status is already 'completed'.
do $$ begin
  create policy "candidate update own session" on wse_sessions for update
    using (auth.uid() = candidate_id)
    with check (auth.uid() = candidate_id);
exception when duplicate_object then null; end $$;

-- Powers the public /prooffile/[assessmentId] view: anyone can read a
-- completed session's non-sensitive fields, but never an in_progress one.
-- `to public` (not `to anon`) so this also covers a logged-in candidate or
-- employer browsing someone else's public Prooffile link - `to anon` would
-- only apply to genuinely unauthenticated requests and silently block any
-- authenticated visitor instead.
do $$ begin
  create policy "public select completed sessions" on wse_sessions for select
    to public using (status = 'completed');
exception when duplicate_object then null; end $$;

-- wse_scenario_responses -------------------------------------------------

do $$ begin
  create policy "candidate select own responses" on wse_scenario_responses for select
    using (exists (
      select 1 from wse_sessions s
      where s.id = session_id and s.candidate_id = auth.uid()
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "candidate insert own responses" on wse_scenario_responses for insert
    with check (exists (
      select 1 from wse_sessions s
      where s.id = session_id and s.candidate_id = auth.uid() and s.status = 'in_progress'
    ));
exception when duplicate_object then null; end $$;

-- The USING clause is evaluated against the pre-update row: once
-- submitted_at is set, this policy no longer matches, so the row becomes
-- immutable after submit with no extra trigger needed.
-- USING gates which existing rows can be targeted (must be un-submitted).
-- WITH CHECK must be given explicitly here: Postgres defaults it to the
-- USING expression when omitted, which would re-evaluate "submitted_at is
-- null" against the NEW row too - and the whole point of this update is to
-- set submitted_at, so that default would reject every submission outright.
do $$ begin
  create policy "candidate submit own response once" on wse_scenario_responses for update
    using (
      submitted_at is null
      and exists (
        select 1 from wse_sessions s
        where s.id = session_id and s.candidate_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from wse_sessions s
        where s.id = session_id and s.candidate_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- dmcs_scores -------------------------------------------------------------
-- SELECT + INSERT only. No UPDATE/DELETE policy for any role is defined
-- anywhere for this table, so Postgres denies those operations by default —
-- this is what makes "append-only" a real DB-level guarantee, not just a
-- convention followed by application code.

do $$ begin
  create policy "candidate select own dmcs" on dmcs_scores for select
    using (exists (
      select 1 from wse_sessions s
      where s.id = session_id and s.candidate_id = auth.uid()
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insert dmcs for own completed session" on dmcs_scores for insert
    with check (exists (
      select 1 from wse_sessions s
      where s.id = session_id and s.candidate_id = auth.uid() and s.status = 'completed'
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public select dmcs for completed sessions" on dmcs_scores for select
    to public using (exists (
      select 1 from wse_sessions s
      where s.id = session_id and s.status = 'completed'
    ));
exception when duplicate_object then null; end $$;

-- ciq_signals ---------------------------------------------------------------
-- Same append-only shape as dmcs_scores. The public Prooffile must never see
-- the per-heuristic detail columns (timing_detail, paste_detail,
-- duplicate_detail) or the version/thresholds implied by them, so anon only
-- ever gets access through the restricted view below, never the base table.

do $$ begin
  create policy "candidate select own ciq" on ciq_signals for select
    using (exists (
      select 1 from wse_sessions s
      where s.id = session_id and s.candidate_id = auth.uid()
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insert ciq for own completed session" on ciq_signals for insert
    with check (exists (
      select 1 from wse_sessions s
      where s.id = session_id and s.candidate_id = auth.uid() and s.status = 'completed'
    ));
exception when duplicate_object then null; end $$;

create or replace view public_ciq_status
  with (security_invoker = true)
  as select session_id, status from ciq_signals;

grant select on public_ciq_status to anon, authenticated;

-- Needed for public_ciq_status (security_invoker) to resolve rows for any
-- reader - anonymous or logged-in - viewing someone else's public
-- Prooffile link, mirroring the read policy on wse_sessions above but
-- without exposing the detail columns.
do $$ begin
  create policy "public select ciq status for completed sessions" on ciq_signals for select
    to public using (exists (
      select 1 from wse_sessions s
      where s.id = session_id and s.status = 'completed'
    ));
exception when duplicate_object then null; end $$;

-- candidates (defined in 0001) -----------------------------------------
-- The public Prooffile needs the candidate's display name. RLS controls
-- rows, not columns, so - same reasoning as public_ciq_status above - this
-- is exposed only through a restricted view (id, display_name), never the
-- base table directly, so a future query can't accidentally leak email by
-- selecting `*` from candidates thinking it's public-safe.
do $$ begin
  create policy "public select candidates with completed sessions" on candidates for select
    to public using (exists (
      select 1 from wse_sessions s
      where s.candidate_id = candidates.id and s.status = 'completed'
    ));
exception when duplicate_object then null; end $$;

create or replace view public_candidate_identity
  with (security_invoker = true)
  as select id, display_name from candidates;

grant select on public_candidate_identity to anon, authenticated;
