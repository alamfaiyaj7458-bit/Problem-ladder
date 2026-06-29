import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { Card } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";
import type { DifficultyLevel } from "@/lib/types";

export const revalidate = 0;

const LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced", "expert", "master"];

const LEVEL_COLOR: Record<DifficultyLevel, string> = {
  beginner: "bg-level-beginner/10 text-level-beginner",
  intermediate: "bg-level-intermediate/10 text-level-intermediate",
  advanced: "bg-level-advanced/10 text-level-advanced",
  expert: "bg-level-expert/10 text-level-expert",
  master: "bg-level-master/10 text-level-master",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/dashboard");

  const supabase = await createClient();

  const { data: submissions } = await supabase
    .from("user_submissions")
    .select("problem_id, submitted_at, problems(id, title, difficulty_level, chapter_id, chapters(name, slug, units(name, slug)))")
    .eq("user_id", profile.id)
    .eq("is_correct", true)
    .order("submitted_at", { ascending: false });

  const solved = submissions ?? [];
  const total = solved.length;

  // "Continue where you left off" — next unsolved problem in the most recently active chapter
  let continueCard: { id: string; title: string; difficulty_level: string; difficulty_score: number; chapter_name: string; unit_name: string } | null = null;
  if (solved.length > 0) {
    const lastChapterId = (solved[0] as unknown as { problems: { chapter_id: string } }).problems?.chapter_id;
    if (lastChapterId) {
      const solvedIds = solved.map((s) => s.problem_id);
      const { data: nextUp } = await supabase
        .from("problems")
        .select("id, title, difficulty_level, difficulty_score, chapter_id, chapters(name, units(name))")
        .eq("chapter_id", lastChapterId)
        .eq("status", "published")
        .not("id", "in", `(${solvedIds.join(",")})`)
        .order("difficulty_score", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextUp) {
        const ch = (nextUp as unknown as { chapters: { name: string; units: { name: string } } }).chapters;
        continueCard = {
          id: nextUp.id,
          title: nextUp.title,
          difficulty_level: nextUp.difficulty_level,
          difficulty_score: nextUp.difficulty_score,
          chapter_name: ch?.name ?? "",
          unit_name: ch?.units?.name ?? ""
        };
      }
    }
  }

  const byLevel = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<DifficultyLevel, number>;
  for (const s of solved) {
    const p = (s as unknown as { problems: { difficulty_level: DifficultyLevel } }).problems;
    if (p?.difficulty_level) byLevel[p.difficulty_level]++;
  }

  // Most recent 5 for the "recently solved" section
  const recent = solved.slice(0, 5);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-2xl text-ink">
          {profile.display_name ? `Welcome back, ${profile.display_name.split(" ")[0]}` : "Dashboard"}
        </h1>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Continue where you left off                                        */}
      {/* ------------------------------------------------------------------ */}
      {continueCard && (
        <Link
          href={`/problems/${continueCard.id}`}
          className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-accent/30 bg-accent/5 px-5 py-4 hover:bg-accent/10 transition-colors"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">Continue where you left off</p>
            <p className="mt-1 font-serif text-base text-ink truncate">{continueCard.title}</p>
            <p className="mt-0.5 text-xs text-ink-faint">{continueCard.unit_name} › {continueCard.chapter_name}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-accent" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Stats                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="font-serif text-3xl text-ink">{total}</p>
          <p className="mt-1 text-xs text-ink-faint uppercase tracking-wide">Problems solved</p>
        </Card>
        {LEVELS.map((l) => (
          <Card key={l} className="p-4 text-center">
            <p className="font-serif text-3xl text-ink">{byLevel[l]}</p>
            <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${LEVEL_COLOR[l]}`}>
              {l}
            </p>
          </Card>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Recently solved                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint">Recently solved</h2>
          {solved.length > 5 && (
            <Link href="/dashboard/history" className="text-xs text-accent hover:underline">
              View all {total}
            </Link>
          )}
        </div>

        {solved.length === 0 ? (
          <p className="text-sm text-ink-faint">
            No problems solved yet.{" "}
            <Link href="/" className="text-accent hover:underline">
              Start solving
            </Link>
          </p>
        ) : (
          <Card className="divide-y divide-line">
            {recent.map((s) => {
              const p = (s as unknown as {
                problems: {
                  id: string;
                  title: string;
                  difficulty_level: DifficultyLevel;
                  chapters: { name: string; slug: string; units: { name: string; slug: string } };
                };
              }).problems;
              if (!p) return null;
              return (
                <Link
                  key={s.problem_id}
                  href={`/problems/${s.problem_id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-ink/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-ink-faint">
                      {p.chapters?.units?.name} › {p.chapters?.name}
                    </p>
                  </div>
                  <DifficultyBadge level={p.difficulty_level} />
                </Link>
              );
            })}
          </Card>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Full solved history (shown below recent if ≤ 20 total)             */}
      {/* ------------------------------------------------------------------ */}
      {solved.length > 5 && solved.length <= 20 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-ink-faint">All solved problems</h2>
          <Card className="divide-y divide-line">
            {solved.map((s) => {
              const p = (s as unknown as {
                problems: {
                  id: string;
                  title: string;
                  difficulty_level: DifficultyLevel;
                  chapters: { name: string; slug: string; units: { name: string; slug: string } };
                };
              }).problems;
              if (!p) return null;
              return (
                <Link
                  key={s.problem_id}
                  href={`/problems/${s.problem_id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-ink/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-ink-faint">
                      {p.chapters?.units?.name} › {p.chapters?.name} · {formatDate(s.submitted_at)}
                    </p>
                  </div>
                  <DifficultyBadge level={p.difficulty_level} />
                </Link>
              );
            })}
          </Card>
        </div>
      )}
    </main>
  );
}