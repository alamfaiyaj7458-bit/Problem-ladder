import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/SearchBar";
import { Card } from "@/components/ui/Field";

export const revalidate = 300; // units/chapters/problems change infrequently

export default async function HomePage() {
  const supabase = await createClient();

  // Run all three independent queries in parallel
  const [
    { data: units },
    { data: chaptersRaw },
    { data: problemsRaw },
  ] = await Promise.all([
    supabase.from("units").select("id, name, slug, description, chapters(id)").order("sort_order"),
    supabase.from("chapters").select("id, name, slug, unit_id, units(name, slug)"),
    supabase.from("problems")
      .select("id, title, difficulty_level, chapter_id, chapters(name, slug, units(name, slug))")
      .eq("status", "published")
      .order("difficulty_score", { ascending: true }),
  ]);

  const searchUnits = (units ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    slug: u.slug,
    description: u.description ?? null,
  }));

  const searchChapters = (chaptersRaw ?? []).map((ch) => {
    const unit = (ch as unknown as { units: { name: string; slug: string } }).units;
    return {
      id: ch.id,
      name: ch.name,
      slug: ch.slug,
      unitName: unit?.name ?? "",
      unitSlug: unit?.slug ?? "",
    };
  });

  const searchProblems = (problemsRaw ?? []).map((p) => {
    const ch = (p as unknown as { chapters: { name: string; slug: string; units: { name: string; slug: string } } }).chapters;
    return {
      id: p.id,
      title: p.title,
      difficultyLevel: p.difficulty_level as string,
      chapterName: ch?.name ?? "",
      unitName: ch?.units?.name ?? "",
      chapterSlug: ch?.slug ?? "",
      unitSlug: ch?.units?.slug ?? "",
    };
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl leading-tight text-ink">
          Find the right problem. Climb the ladder.
        </h1>
        <p className="mt-3 text-ink-soft">
          Search by concept, pick a chapter, choose your level, and solve.
        </p>
        <div className="mt-8">
          <SearchBar autoFocus units={searchUnits} chapters={searchChapters} problems={searchProblems} />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-faint">Browse by unit</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(units ?? []).map((unit) => (
            <Link key={unit.id} href={`/units/${unit.slug}`}>
              <Card className="p-5 transition-shadow hover:shadow-md">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-lg text-ink">{unit.name}</h3>
                  <span className="font-mono text-xs text-ink-faint">
                    {(unit as unknown as { chapters: unknown[] }).chapters?.length ?? 0} chapters
                  </span>
                </div>
                {unit.description && <p className="mt-1.5 text-sm text-ink-soft">{unit.description}</p>}
              </Card>
            </Link>
          ))}
        </div>
        {(!units || units.length === 0) && (
          <p className="text-sm text-ink-faint">
            No units yet — an admin needs to create one first.
          </p>
        )}
      </section>
    </main>
  );
}