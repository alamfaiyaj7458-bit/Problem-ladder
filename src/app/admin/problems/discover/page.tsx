import { createClient } from "@/lib/supabase/server";
import { DiscoveryForm } from "@/components/admin/DiscoveryForm";
import { CandidateCard } from "@/components/admin/CandidateCard";

export const revalidate = 0;

export default async function DiscoverProblemsPage() {
  const supabase = await createClient();
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*, units(name)")
    .order("sort_order");
  const { data: candidates } = await supabase
    .from("problem_candidates")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const chapterOptions = (chapters ?? []).map((c) => ({
    ...c,
    unitName: (c as unknown as { units: { name: string } }).units?.name ?? ""
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-ink">Internet discovery</h1>
      <p className="mt-1 mb-6 text-sm text-ink-soft">
        Find real existing problems instead of generating new ones. Every candidate needs your review.
      </p>
      <DiscoveryForm chapters={chapterOptions} />

      <h2 className="mt-10 mb-3 text-sm font-medium uppercase tracking-wide text-ink-faint">
        Pending candidates ({candidates?.length ?? 0})
      </h2>
      <div className="grid gap-4">
        {(candidates ?? []).map((c) => (
          <CandidateCard key={c.id} candidate={c} />
        ))}
        {(!candidates || candidates.length === 0) && (
          <p className="text-sm text-ink-faint">No pending candidates right now.</p>
        )}
      </div>
    </div>
  );
}
