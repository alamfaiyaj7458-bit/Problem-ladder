import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProblemEditForm } from "@/components/admin/ProblemEditForm";
import { DuplicateWarningBanner } from "@/components/admin/DuplicateWarningBanner";
import { SolutionWorkflowPanel } from "@/components/admin/SolutionWorkflowPanel";
import { PublishControls } from "@/components/admin/PublishControls";
import { DeleteProblemButton } from "@/components/admin/DeleteProblemButton";
import { Card } from "@/components/ui/Field";
import { SOURCE_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { ProblemSource } from "@/lib/types";

export const revalidate = 0;

export default async function AdminProblemDetailPage({ params }: { params: Promise<{ problemId: string }> }) {
  const { problemId } = await params;
  const supabase = await createClient();

  const { data: problem } = await supabase
    .from("problems")
    .select("*, chapters(name, units(name))")
    .eq("id", problemId)
    .single();
  if (!problem) notFound();

  const { data: solution } = await supabase
    .from("solutions")
    .select("*")
    .eq("problem_id", problem.id)
    .maybeSingle();

  const chapter = (problem as unknown as { chapters: { name: string; units: { name: string } } }).chapters;

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-ink-faint">
        <Link href="/admin/problems" className="hover:text-accent">
          Review queue
        </Link>
        {" / "}
        {chapter?.units?.name} &gt; {chapter?.name}
      </p>

      <div className="mt-1 flex items-start justify-between gap-4">
        <h1 className="font-serif text-2xl text-ink">{problem.title}</h1>
        <DeleteProblemButton problemId={problem.id} title={problem.title} />
      </div>

      <p className="mt-1 font-mono text-xs text-ink-faint">
        {SOURCE_LABEL[problem.source as ProblemSource]}
        {problem.source_url && (
          <>
            {" · "}
            <a href={problem.source_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
              source
            </a>
          </>
        )}
        {" · created "}
        {formatDate(problem.created_at)}
      </p>

      <div className="mt-6">
        <DuplicateWarningBanner
          problemId={problem.id}
          chapterId={problem.chapter_id}
          title={problem.title}
          statement={problem.statement}
        />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_220px]">
        <ProblemEditForm problem={problem} />
        <PublishControls problemId={problem.id} status={problem.status} />
      </div>

      <div className="mt-6">
        <SolutionWorkflowPanel
          problemId={problem.id}
          title={problem.title}
          statement={problem.statement}
          existingSolution={solution ?? null}
        />
      </div>

      {solution?.status === "published" && (
        <Card className="mt-6 p-4">
          <p className="text-xs text-ink-faint">
            This solution is published and visible to students alongside the problem.
          </p>
        </Card>
      )}
    </div>
  );
}
