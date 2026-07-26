-- Discovered while building the employer scoring replay view: unlike
-- wse_sessions/dmcs_scores/ciq_signals, wse_scenario_responses has no
-- read policy at all beyond "the owning candidate" - so an employer
-- viewing the replay page would get zero rows for input_events.
--
-- Scoped `to authenticated` (not `to public`, unlike the existing
-- completed-session policies on wse_sessions/dmcs_scores) because the
-- access decision for this feature is specifically "must be logged in",
-- not "public if you know the ID" - `to public` would let an anonymous
-- caller pull input_events directly via the REST API, bypassing the
-- employer-login wall this route enforces at the application layer.
-- input_events carries field names/event types/timestamps only, never
-- answer text or clipboard content (see hooks/useFieldInputTracking.ts),
-- so this is a narrow, low-sensitivity exposure.
do $$ begin
  create policy "authenticated select responses for completed sessions" on wse_scenario_responses
    for select
    to authenticated
    using (exists (
      select 1 from wse_sessions s
      where s.id = session_id and s.status = 'completed'
    ));
exception when duplicate_object then null; end $$;
