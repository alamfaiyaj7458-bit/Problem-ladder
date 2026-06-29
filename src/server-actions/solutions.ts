"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import type { AiSolutionWorkflowLog, SolutionSource } from "@/lib/types";

export async function saveSolution(
  problemId: string,
  args: { content: string; source: SolutionSource; workflowLog?: AiSolutionWorkflowLog | null }
) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const content = args.content.trim();
  if (!content) throw new Error("Solution content is required");

  const { error } = await supabase.from("solutions").upsert(
    {
      problem_id: problemId,
      content,
      source: args.source,
      ai_workflow_log: args.workflowLog ?? null,
      created_by: profile.id
    },
    { onConflict: "problem_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/problems/${problemId}`);
}
