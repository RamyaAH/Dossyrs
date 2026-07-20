-- Baseline for tables that already exist in the live Supabase project but
-- were never captured in version control. This is a GUARDED FALLBACK, not a
-- verified source of truth: columns below are inferred from the queries in
-- app/candidate/signup, app/candidate/dashboard, app/employer/signup, and
-- app/employer/dashboard. `create table if not exists` means this is safe to
-- run against the live project without clobbering anything already there.
--
-- Replace this file with a real `supabase db pull` baseline once CLI/project
-- access is available — do not treat it as authoritative if it ever conflicts
-- with the live schema (e.g. existing RLS policies not captured here).

create table if not exists candidates (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists employers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists employer_seats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employer_id uuid not null references employers(id) on delete cascade,
  seat_type text not null check (seat_type in ('admin', 'recruiter', 'hiring_manager')),
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  unique (user_id, employer_id)
);

alter table candidates enable row level security;
alter table employers enable row level security;
alter table employer_seats enable row level security;

do $$ begin
  create policy "candidate select own row" on candidates for select
    using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "candidate insert own row" on candidates for insert
    with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- employers/employer_seats already had their own policies live in the
-- project (Anyone can create a new employer account / Employer seats can
-- view their own employer / Seats can view other seats at the same
-- employer / Admins can update seats at their employer / Users can insert
-- their own seat) - nothing added here for those two tables. See
-- 0008_fix_employer_seats_recursion.sql for a real bug found in one of
-- those pre-existing policies.
