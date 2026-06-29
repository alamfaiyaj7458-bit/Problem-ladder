import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { UnitChapterBreadcrumb } from "@/components/UnitChapterBreadcrumb";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { SolutionReveal } from "@/components/SolutionReveal";
import { TagChip } from "@/components/TagChip";
import { BackLink } from "@/components/BackLink";
import { ProblemCard } from "@/components/ProblemCard";
import { MathContent } from "@/components/MathContent";

export const revalidate = 0;

export default async function ProblemPage({ params }: { params: Promise<{ problemId: string }> }) {
  const { problemId } = await params;
  const supabase = await createClient();

  const { data: problem } = await supabase
    .from("problems")
    .select("id, chapter_id, title, statement, difficulty_level, difficulty_score, tags, status, chapters(name, slug, units(name, slug))")
    .eq("id", problemId)
    .eq("status", "published")
    .single();

  if (!problem) notFound();

  const chapter = (problem as unknown as {
    chapters: { name: string; slug: string; units: { name: string; slug: string } };
  }).chapters;

  const { data: solution } = await supabase
    .from("solutions")
    .select("content")
    .eq("problem_id", problem.id)
    .eq("status", "published")
    .maybeSingle();

  // All published siblings in the same chapter + same difficulty level, sorted by score
  const { data: siblings } = await supabase
    .from("problems")
    .select("id, title, difficulty_level, difficulty_score, tags")
    .eq("chapter_id", (problem as unknown as { chapter_id: string }).chapter_id ?? "")
    .eq("status", "published")
    .eq("difficulty_level", problem.difficulty_level)
    .order("difficulty_score", { ascending: true });

  // Separate current from others; find the next one in sorted order
  const others = (siblings ?? []).filter((p) => p.id !== problem.id);
  const currentIndex = (siblings ?? []).findIndex((p) => p.id === problem.id);
  const nextProblem = currentIndex >= 0 ? (siblings ?? [])[currentIndex + 1] ?? null : null;
  const prevProblem = currentIndex > 0 ? (siblings ?? [])[currentIndex - 1] ?? null : null;

  // Check if the signed-in user has already solved this problem
  const profile = await getCurrentProfile();
  let alreadySolved = false;
  if (profile) {
    const { data: submission } = await supabase
      .from("user_submissions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("problem_id", problem.id)
      .maybeSingle();
    alreadySolved = !!submission;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <BackLink
        href={`/units/${chapter.units.slug}/${chapter.slug}?level=${problem.difficulty_level}`}
        label={chapter.name}
      />
      <div className="mt-4 flex items-start justify-between gap-4">
        <UnitChapterBreadcrumb
          unitName={chapter.units.name}
          unitSlug={chapter.units.slug}
          chapterName={chapter.name}
          chapterSlug={chapter.slug}
        />
        <div className="flex flex-col items-end gap-1">
          <DifficultyBadge level={problem.difficulty_level} score={problem.difficulty_score} />
          {currentIndex >= 0 && (
            <span className="text-xs text-ink-faint">
              Problem {currentIndex + 1} of {(siblings ?? []).length}
            </span>
          )}
        </div>
      </div>

      <h1 className="mt-6 font-serif text-2xl text-ink">{problem.title}</h1>

      <div className="mt-6 mb-10">
        <MathContent mode="compact" className="font-serif text-xl">
          {problem.statement}
        </MathContent>
      </div>

      <SolutionReveal
        content={solution?.content ?? null}
        problemId={problem.id}
        problemTitle={problem.title}
        problemStatement={problem.statement}
        isSignedIn={!!profile}
        alreadySolved={alreadySolved}
        nextProblemId={nextProblem?.id ?? null}
        prevProblemId={prevProblem?.id ?? null}
      />

      {problem.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
          {problem.tags.map((t: string) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
      )}

      {/* Other problems in the same difficulty level */}
      {others.length > 0 && (
        <div className="mt-10 border-t border-line pt-6">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-ink-faint">
            More {problem.difficulty_level} problems in this chapter
          </p>
          <div className="grid gap-3">
            {others.map((p) => (
              <ProblemCard
                key={p.id}
                id={p.id}
                title={p.title}
                level={p.difficulty_level}
                score={p.difficulty_score}
                tags={p.tags}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}