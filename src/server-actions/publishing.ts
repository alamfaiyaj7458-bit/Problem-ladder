"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireAdmin } from "@/lib/supabase/server";

export async function submitForReview(problemId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("problems")
    .update({ status: "review" })
    .eq("id", problemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/problems/${problemId}`);
  revalidatePath("/admin/problems");
}

export async function revertToDraft(problemId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("problems")
    .update({ status: "draft" })
    .eq("id", problemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/problems/${problemId}`);
  revalidatePath("/admin/problems");
}

/** Publishing requires a non-empty solution and a complete MCQ (>= 2 options, a marked correct one). */
export async function publishProblem(problemId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: solution } = await supabase
    .from("solutions")
    .select("content")
    .eq("problem_id", problemId)
    .maybeSingle();

  if (!solution || !solution.content.trim()) {
    throw new Error("Add a solution before publishing this problem.");
  }

  const { data: problem } = await supabase
    .from("problems")
    .select("options, correct_option")
    .eq("id", problemId)
    .single();

  if (!problem || !problem.options || problem.options.length < 2 || problem.correct_option === null) {
    throw new Error("Add at least 2 answer choices and mark the correct one before publishing.");
  }

  const { error: problemError } = await supabase
    .from("problems")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", problemId);
  if (problemError) throw new Error(problemError.message);

  const { error: solutionError } = await supabase
    .from("solutions")
    .update({ status: "published" })
    .eq("problem_id", problemId);
  if (solutionError) throw new Error(solutionError.message);

  revalidatePath(`/admin/problems/${problemId}`);
  revalidatePath("/admin/problems");
  revalidatePath("/");
}

export async function unpublishProblem(problemId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("problems")
    .update({ status: "review" })
    .eq("id", problemId);
  if (error) throw new Error(error.message);

  await supabase.from("solutions").update({ status: "review" }).eq("problem_id", problemId);

  revalidatePath(`/admin/problems/${problemId}`);
  revalidatePath("/admin/problems");
  revalidatePath("/");
}

export async function bulkPublish(problemIds: string[]) {
  await requireAdmin();
  const supabase = await createClient();

  // Only publish problems that actually have a solution with content
  const { data: solutions } = await supabase
    .from("solutions")
    .select("problem_id, content")
    .in("problem_id", problemIds);

  const solvedIds = new Set((solutions ?? []).filter((s) => s.content?.trim()).map((s) => s.problem_id));

  const { data: problems } = await supabase
    .from("problems")
    .select("id, options, correct_option")
    .in("id", problemIds);

  const eligibleIds = (problems ?? [])
    .filter((p) => solvedIds.has(p.id) && p.options && p.options.length >= 2 && p.correct_option !== null)
    .map((p) => p.id);

  if (eligibleIds.length === 0) {
    throw new Error("None of the selected problems have both a solution and complete answer choices yet.");
  }

  const now = new Date().toISOString();

  const { error: problemError } = await supabase
    .from("problems")
    .update({ status: "published", published_at: now })
    .in("id", eligibleIds);
  if (problemError) throw new Error(problemError.message);

  const { error: solutionError } = await supabase
    .from("solutions")
    .update({ status: "published" })
    .in("problem_id", eligibleIds);
  if (solutionError) throw new Error(solutionError.message);

  revalidatePath("/admin/problems");
  revalidatePath("/");

  return { published: eligibleIds.length, skipped: problemIds.length - eligibleIds.length };
}