import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Field";
import { BackLink } from "@/components/BackLink";

export const revalidate = 300;

export default async function UnitPage({ params }: { params: Promise<{ unitSlug: string }> }) {
  const { unitSlug } = await params;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("id, name, slug, description")
    .eq("slug", unitSlug)
    .single();

  if (!unit) notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name, slug, description, problems(id)")
    .eq("unit_id", unit.id)
    .order("sort_order");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <BackLink href="/" label="All units" />
      <p className="mt-4 text-sm text-ink-faint">
        <Link href="/" className="hover:text-accent">
          Problem Ladder
        </Link>
        {" / "}
        {unit.name}
      </p>
      <h1 className="mt-2 font-serif text-3xl text-ink">{unit.name}</h1>
      {unit.description && <p className="mt-2 text-ink-soft">{unit.description}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {(chapters ?? []).map((chapter) => (
          <Link key={chapter.id} href={`/units/${unit.slug}/${chapter.slug}`}>
            <Card className="p-5 transition-shadow hover:shadow-md">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-lg text-ink">{chapter.name}</h3>
                <span className="font-mono text-xs text-ink-faint">
                  {(chapter as unknown as { problems: unknown[] }).problems?.length ?? 0} problems
                </span>
              </div>
              {chapter.description && <p className="mt-1.5 text-sm text-ink-soft">{chapter.description}</p>}
            </Card>
          </Link>
        ))}
      </div>
      {(!chapters || chapters.length === 0) && (
        <p className="mt-4 text-sm text-ink-faint">No chapters in this unit yet.</p>
      )}
    </main>
  );
}