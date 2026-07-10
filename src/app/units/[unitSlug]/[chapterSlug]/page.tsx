import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { LadderSwitcher } from "@/components/DifficultyBadge";
import { ProblemList } from "@/components/ProblemList";
import { DIFFICULTY_LABEL } from "@/lib/difficulty";
import { BackLink } from "@/components/BackLink";
import type { DifficultyLevel } from "@/lib/types";

export const revalidate = 300;

const VALID_LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced", "expert", "master"];

// Pre-render every chapter at build time — served from CDN, no DB hit on load
export async function generateStaticParams() {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("chapters")
    .select("slug, units(slug)");
  return (data ?? [])
    .map((ch) => ({
      unitSlug: (ch as unknown as { units: { slug: string } }).units?.slug ?? "",
      chapterSlug: ch.slug,
    }))
    .filter((p) => p.unitSlug);
}

export default async function ChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ unitSlug: string; chapterSlug: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { unitSlug, chapterSlug } = await params;
  const { level: levelParam } = await searchParams;
  const supabase = await createClient();

  // Phase 1: unit+chapter joined
  const [unitResult] = await Promise.all([
    supabase
      .from("units")
      .select("id, name, slug, chapters!inner(id, name, slug, description)")
      .eq("slug", unitSlug)
      .eq("chapters.slug", chapterSlug)
      .single(),
  ]);

  if (!unitResult.data) notFound();
  const unit = unitResult.data;
  const chapter = (unit as unknown as {
    chapters: { id: string; name: string; slug: string; description: string | null }[];
  }).chapters?.[0];
  if (!chapter) notFound();

  // Phase 2: problems filtered directly by this chapter's id
  const { data: published } = await supabase
    .from("problems")
    .select("id, title, difficulty_level, difficulty_score, tags")
    .eq("chapter_id", chapter.id)
    .eq("status", "published")
    .order("difficulty_score", { ascending: true });

  const chapterProblems = published ?? [];

  const counts: Partial<Record<DifficultyLevel, number>> = {};
  for (const level of VALID_LEVELS) {
    counts[level] = chapterProblems.filter((p) => p.difficulty_level === level).length;
  }

  const selectedLevel =
    levelParam && VALID_LEVELS.includes(levelParam as DifficultyLevel)
      ? (levelParam as DifficultyLevel)
      : undefined;

  const visibleProblems = selectedLevel
    ? chapterProblems.filter((p) => p.difficulty_level === selectedLevel)
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <BackLink href={`/units/${unitSlug}`} label={unit.name} />
      <p className="mt-4 text-sm text-ink-faint">
        <Link href="/" className="hover:text-accent">Problem Ladder</Link>
        {" / "}
        <Link href={`/units/${unit.slug}`} className="hover:text-accent">{unit.name}</Link>
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
          /* ProblemList is a client component — fetches solved status after mount
             so the static shell above can be cached and served from CDN */
          <ProblemList
            problems={visibleProblems as unknown as {
              id: string; title: string;
              difficulty_level: DifficultyLevel;
              difficulty_score: number;
              tags: string[] | null;
            }[]}
            chapterId={chapter.id}
          />
        )}
      </div>
    </main>
  );
}