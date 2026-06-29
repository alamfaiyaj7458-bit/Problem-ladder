-- ---------------------------------------------------------------------------
-- User submissions — tracks whether a user has attempted/solved a problem.
-- ---------------------------------------------------------------------------
create table if not exists user_submissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  problem_id  uuid not null references problems(id) on delete cascade,
  is_correct  boolean not null default false,
  answer      text,
  submitted_at timestamptz not null default now(),
  unique (user_id, problem_id)          -- one submission record per user/problem (upserted)
);

create index if not exists user_submissions_user_id_idx on user_submissions(user_id);
create index if not exists user_submissions_problem_id_idx on user_submissions(problem_id);

alter table user_submissions enable row level security;

-- Users can only read/write their own submissions; admins can read all.
create policy "submissions_own" on user_submissions
  for all using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id);
