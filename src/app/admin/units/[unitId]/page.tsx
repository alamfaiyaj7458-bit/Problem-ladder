import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createChapter } from "@/server-actions/chapters";
import { Card, Input, Textarea, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ChapterRow } from "@/components/admin/ChapterRow";

export const revalidate = 0;

export default async function AdminUnitChaptersPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const supabase = await createClient();

  const { data: unit } = await supabase.from("units").select("*").eq("id", unitId).single();
  if (!unit) notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*, problems(id)")
    .eq("unit_id", unit.id)
    .order("sort_order");

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/admin/units" className="hover:text-accent">
          Units
        </Link>
        {" / "}
        {unit.name}
      </p>
      <h1 className="mt-1 font-serif text-2xl text-ink">{unit.name}</h1>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-medium text-ink-soft">New chapter</h2>
        <form action={createChapter.bind(null, unit.id)} className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input name="name" required placeholder="e.g. Circles" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" rows={2} placeholder="Optional" />
          </div>
          <Button type="submit" size="sm">
            Create chapter
          </Button>
        </form>
      </Card>

      <Card className="mt-6 divide-y divide-line">
        {(chapters ?? []).map((chapter) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            problemCount={(chapter as unknown as { problems: unknown[] }).problems?.length ?? 0}
          />
        ))}
        {(!chapters || chapters.length === 0) && (
          <p className="px-4 py-3 text-sm text-ink-faint">No chapters in this unit yet.</p>
        )}
      </Card>
    </div>
  );
}
