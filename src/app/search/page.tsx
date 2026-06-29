import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/SearchBar";
import { ProblemCard } from "@/components/ProblemCard";
import type { SearchResult } from "@/lib/types";

export const revalidate = 0;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  const { data: results } = query
    ? await supabase.rpc("search_problems", { query, max_results: 30 })
    : { data: [] };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <SearchBar initialQuery={query} />

      <div className="mt-8">
        {query && (
          <p className="mb-4 text-sm text-ink-faint">
            {results?.length ?? 0} result{(results?.length ?? 0) === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </p>
        )}

        <div className="grid gap-3">
          {(results ?? []).map((r: SearchResult) => (
            <ProblemCard key={r.id} id={r.id} title={r.title} level={r.difficulty_level} tags={r.tags} />
          ))}
        </div>

        {query && (results?.length ?? 0) === 0 && (
          <p className="text-sm text-ink-faint">
            No problems found for that concept yet. Try a different term, or browse by unit from the home page.
          </p>
        )}
      </div>
    </main>
  );
}
