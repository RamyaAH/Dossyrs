-- Continues 0010/0011 (which added candidates.resume_url/portfolio_url and
-- exposed them on the public identity view): candidates could never be
-- edited after signup because no UPDATE policy existed at all - only
-- insert (signup) and select. This adds one, scoped to resume/portfolio
-- only via the trigger below, so the signup page's own promise ("add
-- right away or later from your dashboard") is actually true.

do $$ begin
  create policy "candidate update own row" on candidates for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- RLS is row-scoped, not column-scoped - the policy above technically
-- permits updating any column on the candidate's own row, including
-- display_name and email. email in particular must never be writable
-- through this path: it has to stay in sync with auth.users.email, which
-- only Supabase Auth's own change-email flow should touch. Same
-- belt-and-suspenders pattern as 0007's prevent_completed_session_edits.
create or replace function prevent_candidate_identity_edits() returns trigger as $$
begin
  if old.email is distinct from new.email then
    raise exception 'candidate email cannot be changed through this path';
  end if;
  if old.display_name is distinct from new.display_name then
    raise exception 'candidate display_name cannot be changed through this path';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_candidates_identity_immutable on candidates;
create trigger trg_candidates_identity_immutable
  before update on candidates
  for each row execute function prevent_candidate_identity_edits();
