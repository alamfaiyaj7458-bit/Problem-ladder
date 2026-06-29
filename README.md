# Problem Ladder Engine V2

A problem-solving platform: students discover, solve, and progress through
high-quality problems, organized as **Unit → Chapter → Difficulty Level →
Problems**.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres +
Auth), Gemini API.

---

## 1. Setup

### 1.1 Install dependencies

```bash
npm install
```

### 1.2 Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`.
3. Optionally run `supabase/seed.sql` for a few sample units, chapters,
   problems and solutions so the app isn't empty on first run.
4. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Both are in Project Settings → API.

### 1.3 Get a Gemini API key

1. Get a key at [aistudio.google.com](https://aistudio.google.com).
2. Set `GEMINI_API_KEY` in `.env.local`.
3. `GEMINI_MODEL` defaults to `gemini-2.5-flash` — change it if you'd rather
   use a different model. Internet discovery (`/admin/problems/discover`)
   needs a model/tier that supports Google Search grounding.

### 1.4 Make yourself an admin

Sign up once through the app (`/login`), then in the Supabase SQL editor:

```sql
update profiles set role = 'admin' where id = '<your-user-uuid>';
```

(Find your UUID in Authentication → Users.)

### 1.5 Run it

```bash
npm run dev
```

Visit `http://localhost:3000`. Admin panel is at `/admin`.

---

## 2. How the pieces fit together

### Content hierarchy
Units and chapters are **only** created/edited/deleted by admins
(`/admin/units`). The AI is never allowed to invent one — every AI endpoint
that touches categorization is given the exact list of chapter IDs that
exist and is rejected server-side if it returns anything outside that list
(see `src/app/api/ai/categorize/route.ts`).

### Difficulty
`difficulty_score` (0–100) is the only value anyone — AI or admin — sets
directly. `difficulty_level` is a Postgres **generated column** derived from
the score, so the two can never drift apart. The bands are mirrored in
`src/lib/difficulty.ts` for the UI; if you ever change them, update both
places (the SQL comment says so too).

### Search
`search_problems(query)` is a single Postgres function that full-text
searches across title, statement, tags, chapter name, and unit name — so a
student searching "vieta" finds problems even if "vieta" isn't in any
chapter title. It's a live join, not a stored/materialized index, because at
MVP scale that's simpler and fast enough. Revisit only if the catalog grows
large (see the comment above the function in the migration).

### Duplicate detection
`find_similar_problems(...)` uses Postgres trigram similarity (`pg_trgm`)
against title + statement within the same chapter. It's called live from the
problem detail admin page and just **warns** — it never blocks creation or
auto-rejects anything, per the brief.

### AI content pipeline
Every AI call in `src/lib/gemini/` forces a strict JSON shape via Gemini's
`responseSchema`, and the result is validated *again* on the server with Zod
before it ever touches the database (`src/lib/gemini/schemas.ts`). Nothing
the model returns is trusted on shape alone.

- **Categorize** — pick an existing chapter + assign score/tags for a
  manually-typed problem.
- **Generate problems** — batch-generate for a chosen chapter/level/count.
  Lands as `draft` rows in the review queue; nothing is ever auto-published.
- **Solution workflow** — Generate → Verify → Critique → Fix, each step a
  separate endpoint so the admin can stop, edit, or redirect at any point
  (`src/components/admin/SolutionWorkflowPanel.tsx`). The full log of what
  the AI did is saved alongside the solution (`solutions.ai_workflow_log`)
  for transparency, but only `content` is ever shown to students.
- **Internet discovery** — uses Gemini's Google Search grounding to find
  *real* problems with a real source URL. Results land as `problem_candidates`
  with `status = 'pending'`; an admin must approve each one before it becomes
  a real (draft) problem.

### Publishing workflow
Every problem moves through `draft → review → published`. Publishing is
blocked server-side (`src/server-actions/publishing.ts`) unless a non-empty
solution already exists — AI output is never published unreviewed, manual or
otherwise.

### Source tracking
Every problem records where it came from (`manual`, `ai_generated`,
`internet`, `olympiad_archive`, `modified`) plus an optional `source_url` and
free-text `source_notes`. This is admin-only metadata — it's never shown to
students, consistent with keeping the problem page minimal.

---

## 3. Project structure

```
src/
  app/                  routes (App Router)
    (public)            home, units/[slug], problems/[id], search, login
    admin/              admin-only — gated by middleware.ts + admin/layout.tsx
    api/ai/             every Gemini-backed endpoint
  components/
    ui/                 small primitives (Button, Input, Card, ...)
    admin/              admin-only interactive components
    *.tsx               public-facing components (ProblemCard, SearchBar, ...)
  lib/
    supabase/           browser + server Supabase clients, middleware helper
    gemini/             Gemini client, prompts, JSON/Zod schemas
    difficulty.ts        score <-> level mapping (mirrors the DB)
    duplicate-detection.ts
    types.ts             shared TS types matching the schema
  server-actions/       all DB-mutating logic (units, chapters, problems,
                         solutions, publishing, candidates)
supabase/
  migrations/0001_init.sql   schema, RLS policies, search + duplicate functions
  seed.sql                    optional sample content
```

## 4. Deliberately left out (per the V1 lessons)

- No separate `tags` table — tags are a plain `text[]` column. A many-to-many
  table with its own admin UI wasn't worth it for descriptive search terms.
- No stored/materialized search index — a live join is fast enough at MVP
  scale.
- No persisted "duplicate flags" table — duplicate checks run live and warn;
  nothing is stored or auto-rejected.
- No generic audit log — `status`, `source`, `created_by`/`updated_at`, and
  the AI workflow log already cover the traceability that matters.
