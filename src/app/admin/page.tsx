import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [draftRes, reviewRes, publishedRes, pendingCandidatesRes, recentJobsRes] = await Promise.all([
    supabase.from("problems").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("problems").select("id", { count: "exact", head: true }).eq("status", "review"),
    supabase.from("problems").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("problem_candidates").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("ai_generation_jobs")
      .select("id, target_level, requested_count, generated_count, status, created_at, chapters(name)")
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const stats = [
    { label: "Draft", count: draftRes.count ?? 0, href: "/admin/problems?status=draft" },
    { label: "In review", count: reviewRes.count ?? 0, href: "/admin/problems?status=review" },
    { label: "Published", count: publishedRes.count ?? 0, href: "/admin/problems?status=published" },
    { label: "Pending candidates", count: pendingCandidatesRes.count ?? 0, href: "/admin/problems/discover" }
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-4 transition-shadow hover:shadow-md">
              <p className="font-mono text-2xl text-ink">{s.count}</p>
              <p className="text-xs text-ink-soft">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 mb-3 text-sm font-medium uppercase tracking-wide text-ink-faint">
        Recent AI generation jobs
      </h2>
      <Card className="divide-y divide-line">
        {(recentJobsRes.data ?? []).map((job) => (
          <div key={job.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              {(job as unknown as { chapters: { name: string } }).chapters?.name ?? "Unknown chapter"} ·{" "}
              {job.target_level}
            </span>
            <span className="font-mono text-xs text-ink-faint">
              {job.generated_count}/{job.requested_count} · {job.status} · {formatDate(job.created_at)}
            </span>
          </div>
        ))}
        {(recentJobsRes.data ?? []).length === 0 && (
          <p className="px-4 py-3 text-sm text-ink-faint">No AI generation jobs yet.</p>
        )}
      </Card>
    </div>
  );
}
