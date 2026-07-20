-- Belt-and-suspenders for wse_sessions specifically, since it's the one new
-- table with a real UPDATE policy (the in_progress -> completed transition).
-- dmcs_scores and ciq_signals need no trigger: they simply have no UPDATE
-- policy at all, so Postgres denies updates outright.
create or replace function prevent_completed_session_edits() returns trigger as $$
begin
  if old.status = 'completed' then
    raise exception 'session % is completed and immutable', old.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_wse_sessions_immutable on wse_sessions;
create trigger trg_wse_sessions_immutable
  before update on wse_sessions
  for each row execute function prevent_completed_session_edits();
