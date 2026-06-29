-- Problem Ladder Engine V2 — initial schema
-- Run via the Supabase SQL editor, or `supabase db push` if using the CLI.

create extension if not exists "pg_trgm";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user; carries the admin/student role)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, new.raw_user_meta_data->>'display_name', 'student');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- To promote a user to admin, run once in the SQL editor:
--   update profiles set role = 'admin' where id = '<user-uuid>';

-- ---------------------------------------------------------------------------
-- Units & Chapters — manually managed by admins, AI may only pick from these
-- ---------------------------------------------------------------------------
create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, slug)
);

create index if not exists chapters_unit_id_idx on chapters(unit_id);

-- ---------------------------------------------------------------------------
-- Problems — the primary object in the system
-- ---------------------------------------------------------------------------
create table if not exists problems (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete restrict,

  title text not null,
  statement text not null,

  -- AI assigns the score; the level is derived from it, never set independently,
  -- so the two values can never drift apart.
  difficulty_score numeric(5,2) not null check (difficulty_score >= 0 and difficulty_score <= 100),
  difficulty_level text generated always as (
    case
      when difficulty_score < 20 then 'beginner'
      when difficulty_score < 40 then 'intermediate'
      when difficulty_score < 60 then 'advanced'
      when difficulty_score < 80 then 'expert'
      else 'master'
    end
  ) stored,

  tags text[] not null default '{}',

  status text not null default 'draft' check (status in ('draft', 'review', 'published')),

  source text not null default 'manual'
    check (source in ('manual', 'ai_generated', 'internet', 'olympiad_archive', 'modified')),
  source_url text,
  source_notes text,

  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists problems_chapter_id_idx on problems(chapter_id);
create index if not exists problems_status_idx on problems(status);
create index if not exists problems_difficulty_level_idx on problems(difficulty_level);
create index if not exists problems_tags_idx on problems using gin(tags);
create index if not exists problems_title_trgm_idx on problems using gin(title gin_trgm_ops);
create index if not exists problems_statement_trgm_idx on problems using gin(statement gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Solutions — one current solution per problem. The AI workflow
-- (generate -> verify -> critique -> fix) is logged for admin transparency,
-- but only `content` is ever shown to students, and only once published.
-- ---------------------------------------------------------------------------
create table if not exists solutions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null unique references problems(id) on delete cascade,
  content text not null default '',
  source text not null default 'manual' check (source in ('manual', 'ai_generated', 'ai_assisted')),
  ai_workflow_log jsonb,
  status text not null default 'draft' check (status in ('draft', 'review', 'published')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Problem candidates — output of "Find Existing Problems" (internet discovery).
-- Nothing here is a real problem yet; admins approve or reject each one.
-- ---------------------------------------------------------------------------
create table if not exists problem_candidates (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references units(id) on delete set null,
  chapter_id uuid references chapters(id) on delete set null,
  title text not null,
  statement text not null,
  suggested_difficulty_score numeric(5,2),
  suggested_tags text[] not null default '{}',
  source_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  promoted_problem_id uuid references problems(id),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists problem_candidates_status_idx on problem_candidates(status);

-- ---------------------------------------------------------------------------
-- AI generation jobs — lightweight log of batch generation requests,
-- enough for the admin dashboard's recent-activity view. Not a queue.
-- ---------------------------------------------------------------------------
create table if not exists ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references units(id) on delete set null,
  chapter_id uuid references chapters(id) on delete set null,
  target_level text check (target_level in ('beginner', 'intermediate', 'advanced', 'expert', 'master')),
  requested_count int not null,
  generated_count int not null default 0,
  status text not null default 'completed' check (status in ('completed', 'failed', 'partial')),
  error_message text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists units_set_updated_at on units;
create trigger units_set_updated_at before update on units
  for each row execute procedure set_updated_at();

drop trigger if exists chapters_set_updated_at on chapters;
create trigger chapters_set_updated_at before update on chapters
  for each row execute procedure set_updated_at();

drop trigger if exists problems_set_updated_at on problems;
create trigger problems_set_updated_at before update on problems
  for each row execute procedure set_updated_at();

drop trigger if exists solutions_set_updated_at on solutions;
create trigger solutions_set_updated_at before update on solutions
  for each row execute procedure set_updated_at();

-- ---------------------------------------------------------------------------
-- Search — keyword search over title, statement, tags, chapter and unit
-- names. A live join is plenty fast at MVP scale; revisit with a stored
-- tsvector + GIN index only if/when the catalog gets large.
-- ---------------------------------------------------------------------------
create or replace function search_problems(query text, max_results int default 30)
returns table (
  id uuid,
  title text,
  statement text,
  difficulty_score numeric,
  difficulty_level text,
  tags text[],
  chapter_id uuid,
  chapter_name text,
  unit_id uuid,
  unit_name text,
  rank real
) as $$
  select
    p.id, p.title, p.statement, p.difficulty_score, p.difficulty_level, p.tags,
    c.id as chapter_id, c.name as chapter_name,
    u.id as unit_id, u.name as unit_name,
    ts_rank_cd(
      to_tsvector('english',
        p.title || ' ' || p.statement || ' ' ||
        array_to_string(p.tags, ' ') || ' ' || c.name || ' ' || u.name
      ),
      plainto_tsquery('english', query)
    ) as rank
  from problems p
  join chapters c on c.id = p.chapter_id
  join units u on u.id = c.unit_id
  where p.status = 'published'
    and to_tsvector('english',
          p.title || ' ' || p.statement || ' ' ||
          array_to_string(p.tags, ' ') || ' ' || c.name || ' ' || u.name
        ) @@ plainto_tsquery('english', query)
  order by rank desc
  limit max_results;
$$ language sql stable;

-- ---------------------------------------------------------------------------
-- Duplicate detection — trigram similarity against title + statement.
-- Returns close matches above the threshold; the admin decides what to do.
-- ---------------------------------------------------------------------------
create or replace function find_similar_problems(
  p_title text,
  p_statement text,
  p_chapter_id uuid,
  p_exclude_id uuid default null,
  p_threshold real default 0.35
)
returns table (
  id uuid,
  title text,
  status text,
  similarity real
) as $$
  select
    p.id, p.title, p.status,
    greatest(
      similarity(p.title, p_title),
      similarity(p.statement, p_statement)
    ) as similarity
  from problems p
  where p.chapter_id = p_chapter_id
    and (p_exclude_id is null or p.id <> p_exclude_id)
    and (
      similarity(p.title, p_title) > p_threshold
      or similarity(p.statement, p_statement) > p_threshold
    )
  order by similarity desc
  limit 5;
$$ language sql stable;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table units enable row level security;
alter table chapters enable row level security;
alter table problems enable row level security;
alter table solutions enable row level security;
alter table problem_candidates enable row level security;
alter table ai_generation_jobs enable row level security;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- profiles: everyone can read their own row; admins can read all.
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or is_admin());
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- units / chapters: public read, admin write.
create policy "units_public_read" on units for select using (true);
create policy "units_admin_write" on units for all using (is_admin()) with check (is_admin());

create policy "chapters_public_read" on chapters for select using (true);
create policy "chapters_admin_write" on chapters for all using (is_admin()) with check (is_admin());

-- problems: public read of published rows only; admins see and manage everything.
create policy "problems_public_read_published" on problems
  for select using (status = 'published' or is_admin());
create policy "problems_admin_write" on problems
  for all using (is_admin()) with check (is_admin());

-- solutions: public read only when published and the parent problem is published.
create policy "solutions_public_read_published" on solutions
  for select using (
    is_admin()
    or (
      status = 'published'
      and exists (select 1 from problems p where p.id = problem_id and p.status = 'published')
    )
  );
create policy "solutions_admin_write" on solutions
  for all using (is_admin()) with check (is_admin());

-- candidates & job log: admin-only, never shown to students.
create policy "candidates_admin_only" on problem_candidates
  for all using (is_admin()) with check (is_admin());
create policy "jobs_admin_only" on ai_generation_jobs
  for all using (is_admin()) with check (is_admin());
