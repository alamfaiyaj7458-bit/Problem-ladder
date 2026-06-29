import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BulkActionsBar } from "@/components/admin/BulkActionsBar";
import type { ProblemStatus } from "@/lib/types";

export const revalidate = 0;

const STATUSES: ProblemStatus[] = ["draft", "review", "published"];
const STATUS_LABEL: Record<ProblemStatus, string> = {
  draft: "Draft",
  review: "In review",
  published: "Published"
};

export default async function ReviewQueuePage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; unit?: string }>;
}) {
  const { status: statusParam, unit: unitParam } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("problems")
    .select("id, title, status, chapter_id, chapters(unit_id, units(id, name))")
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusParam && STATUSES.includes(statusParam as ProblemStatus)) {
    query = query.eq("status", statusParam);
  }

  const { data: rawProblems } = await query;
  const { data: units } = await supabase.from("units").select("id, name").order("sort_order");

  // Filter by unit
  const problems = (rawProblems ?? []).filter((p) => {
    if (!unitParam) return true;
    return (p as unknown as { chapters: { unit_id: string } }).chapters?.unit_id === unitParam;
  });

  // Fetch solution status for all filtered problems in one query
  const problemIds = problems.map((p) => p.id);
  const { data: solutions } = problemIds.length
    ? await supabase
        .from("solutions")
        .select("problem_id, content")
        .in("problem_id", problemIds)
    : { data: [] };

  const solutionMap = new Map(
    (solutions ?? []).map((s) => [s.problem_id, !!s.content?.trim()])
  );

  const problemsForBulk = problems.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    hasSolution: solutionMap.get(p.id) ?? false
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl text-ink">Review queue</h1>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <FilterLink
          label="All statuses"
          href={`/admin/problems${unitParam ? `?unit=${unitParam}` : ""}`}
          active={!statusParam}
        />
        {STATUSES.map((s) => (
          <FilterLink
            key={s}
            label={STATUS_LABEL[s]}
            href={`/admin/problems?status=${s}${unitParam ? `&unit=${unitParam}` : ""}`}
            active={statusParam === s}
          />
        ))}
      </div>

      {/* Unit filters */}
      <div className="mt-3 flex flex-wrap gap-2">
        <FilterLink label="All units" href={statusParam ? `/admin/problems?status=${statusParam}` : "/admin/problems"} active={!unitParam} />
        {(units ?? []).map((u) => (
          <FilterLink
            key={u.id}
            label={u.name}
            href={`/admin/problems?unit=${u.id}${statusParam ? `&status=${statusParam}` : ""}`}
            active={unitParam === u.id}
          />
        ))}
      </div>

      <div className="mt-6">
        <BulkActionsBar problems={problemsForBulk} />
      </div>
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 text-xs",
        active ? "bg-accent text-white" : "bg-ink/5 text-ink-soft hover:bg-ink/10"
      )}
    >
      {label}
    </Link>
  );
}
