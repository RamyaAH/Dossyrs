-- Pre-existing bug, not introduced by this feature: "Seats can view other
-- seats at the same employer" (SELECT) and "Admins can update seats at
-- their employer" (UPDATE) on employer_seats both query employer_seats
-- from within their own USING clause. Postgres detects that self-reference
-- as infinite recursion the moment anything forces evaluation of those
-- policies (e.g. an `insert ... select` on employers, which is exactly
-- what employer signup does) - it doesn't matter whether the recursion
-- comes via employers or a direct employer_seats query.
--
-- Fix: move the self-lookup into a SECURITY DEFINER function. Functions
-- created via the Supabase SQL Editor run as the `postgres` role, which
-- bypasses RLS - so the lookup inside the function no longer re-triggers
-- the policy it's used by, breaking the cycle. This is the standard fix
-- Supabase documents for this exact error.

create or replace function my_employer_id() returns uuid
language sql security definer stable
set search_path = public
as $$
  select employer_id from employer_seats where user_id = auth.uid() limit 1
$$;

create or replace function is_employer_admin(target_employer_id uuid) returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from employer_seats
    where user_id = auth.uid()
      and employer_id = target_employer_id
      and seat_type = 'admin'
  )
$$;

drop policy if exists "Seats can view other seats at the same employer" on employer_seats;
create policy "Seats can view other seats at the same employer" on employer_seats
  for select using (employer_id = my_employer_id());

drop policy if exists "Admins can update seats at their employer" on employer_seats;
create policy "Admins can update seats at their employer" on employer_seats
  for update using (is_employer_admin(employer_id));
