import { createClient } from "@/lib/supabase/server";
import { ManualProblemForm } from "@/components/admin/ManualProblemForm";

export const revalidate = 0;

export default async function NewProblemPage() {
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
      <h1 className="font-serif text-2xl text-ink">New problem</h1>
      <p className="mt-1 mb-6 text-sm text-ink-soft">
        Created as a draft. It won&apos;t be visible to students until it&apos;s reviewed and published.
      </p>
      <ManualProblemForm units={units ?? []} chapters={chapterOptions} />
    </div>
  );
}
