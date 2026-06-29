import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AIGenerationForm } from "@/components/admin/AIGenerationForm";

export const revalidate = 0;

export default async function GenerateProblemsPage() {
  const supabase = await createClient();
  const { data: units } = await supabase.from("units").select("*").order("sort_order");
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*, units(name)")
    .order("sort_order");

  const chapterOptions = (chapters ?? []).map((c) => ({
    ...c,
    unitName: (c as unknown as { units: { name: string } }).units?.name ?? ""
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-ink">AI generation</h1>
      <p className="mt-1 mb-6 text-sm text-ink-soft">
        Pick a unit, chapter, difficulty, and how many problems to generate.{" "}
        <Link href="/admin/problems?status=draft" className="text-accent hover:underline">
          Review drafts
        </Link>{" "}
        once they&apos;re ready.
      </p>
      <AIGenerationForm units={units ?? []} chapters={chapterOptions} />
    </div>
  );
}
