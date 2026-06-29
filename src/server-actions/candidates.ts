"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireAdmin } from "@/lib/supabase/server";

/** Promotes a pending candidate into a real draft problem, awaiting full review. */
export async function approveCandidate(candidateId: string) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: candidate, error: fetchError } = await supabase
    .from("problem_candidates")
    .select("*")
    .eq("id", candidateId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (!candidate.chapter_id) throw new Error("This candidate has no chapter assigned");

  const { data: problem, error: insertError } = await supabase
    .from("problems")
    .insert({
      chapter_id: candidate.chapter_id,
      title: candidate.title,
      statement: candidate.statement,
      difficulty_score: candidate.suggested_difficulty_score ?? 50,
      tags: candidate.suggested_tags,
      status: "draft",
      source: "internet",
      source_url: candidate.source_url,
      created_by: profile.id
    })
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);

  const { error: updateError } = await supabase
    .from("problem_candidates")
    .update({
      status: "approved",
      promoted_problem_id: problem.id,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", candidateId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/admin/problems/discover");
  revalidatePath("/admin/problems");
}

export async function rejectCandidate(candidateId: string) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("problem_candidates")
    .update({ status: "rejected", reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
    .eq("id", candidateId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/problems/discover");
}
