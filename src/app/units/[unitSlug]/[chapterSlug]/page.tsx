import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { LadderSwitcher } from "@/components/DifficultyBadge";
import { ProblemCard } from "@/components/ProblemCard";
import { DIFFICULTY_LABEL } from "@/lib/difficulty";
import { BackLink } from "@/components/BackLink";
import type { DifficultyLevel } from "@/lib/types";

export const revalidate = 0;

const VALID_LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced", "expert", "master"];

export default async function ChapterPage({
  params,
  searchParams
}: {
  params: Promise<{ unitSlug: string; chapterSlug: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { unitSlug, chapterSlug } = await params;
  const { level: levelParam } = await searchParams;
  const supabase = await createClient();

  // Phase 1: fetch unit+chapter (joined) and profile in parallel
  const [unitResult, profile] = await Promise.all([
    supabase
      .from("units")
      .select("id, name, slug, chapters!inner(id, name, slug, description)")
      .eq("slug", unitSlug)
      .eq("chapters.slug", chapterSlug)
      .single(),
    getCurrentProfile(),
  ]);

  if (!unitResult.data) notFound();
  const unit = unitResult.data;
  const chapter = (unit as unknown as {
    chapters: { id: string; name: string; slug: string; description: string | null }[];
  }).chapters?.[0];
  if (!chapter) notFound();

  // Phase 2: fetch problems and user submissions in parallel
  const [{ data: published }, submissionsResult] = await Promise.all([
    supabase
      .from("problems")
      .select("id, title, difficulty_level, difficulty_score, tags")
      .eq("chapter_id", chapter.id)
      .eq("status", "published")
      .order("difficulty_score", { ascending: true }),
    profile
      ? supabase
          .from("user_submissions")
          .select("problem_id, problems!inner(chapter_id)")
          .eq("user_id", profile.id)
          .eq("is_correct", true)
          .eq("problems.chapter_id", chapter.id)
      : Promise.resolve({ data: null }),
  ]);

  const solvedSet = new Set<string>(
    (submissionsResult.data ?? []).map((s) => s.problem_id)
  );

  const counts: Partial<Record<DifficultyLevel, number>> = {};
  for (const level of VALID_LEVELS) {
    counts[level] = (published ?? []).filter((p) => p.difficulty_level === level).length;
  }

  const selectedLevel =
    levelParam && VALID_LEVELS.includes(levelParam as DifficultyLevel)
      ? (levelParam as DifficultyLevel)
      : undefined;

  const visibleProblems = selectedLevel
    ? (published ?? []).filter((p) => p.difficulty_level === selectedLevel)
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <BackLink href={`/units/${unitSlug}`} label={unit.name} />
      <p className="mt-4 text-sm text-ink-faint">
        <Link href="/" className="hover:text-accent">
          Problem Ladder
        </Link>
        {" / "}
        <Link href={`/units/${unit.slug}`} className="hover:text-accent">
          {unit.name}
        </Link>
        {" / "}
        {chapter.name}
      </p>
      <h1 className="mt-2 font-serif text-3xl text-ink">{chapter.name}</h1>
      {chapter.description && <p className="mt-2 text-ink-soft">{chapter.description}</p>}

      <div className="mt-10 rounded-lg border border-line bg-paper-raised p-6 shadow-card">
        <p className="mb-5 text-sm font-medium text-ink-soft">Choose a difficulty level</p>
        <LadderSwitcher
          baseHref={`/units/${unitSlug}/${chapterSlug}`}
          current={selectedLevel}
          counts={counts}
        />
      </div>

      <div className="mt-8">
        {!selectedLevel && (
          <p className="text-sm text-ink-faint">Pick a level above to see its problems.</p>
        )}
        {selectedLevel && visibleProblems.length === 0 && (
          <p className="text-sm text-ink-faint">
            No published {DIFFICULTY_LABEL[selectedLevel].toLowerCase()} problems in this chapter yet.
          </p>
        )}
        {selectedLevel && visibleProblems.length > 0 && (
          <div className="grid gap-3">
            {visibleProblems.map((p) => (
              <ProblemCard key={p.id} id={p.id} title={p.title} level={p.difficulty_level} score={p.difficulty_score} tags={p.tags} solved={solvedSet.has(p.id)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}