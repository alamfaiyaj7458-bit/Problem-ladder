"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export async function submitAnswer(problemId: string, answer: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("You must be signed in to submit an answer.");

  const supabase = await createClient();

  // Fetch the published solution content to compare
  const { data: solution } = await supabase
    .from("solutions")
    .select("content")
    .eq("problem_id", problemId)
    .eq("status", "published")
    .maybeSingle();

  // We don't do exact-string matching — we just record the attempt as
  // "solved" (the student self-reports after seeing the solution).
  // The boolean is set by the client telling us whether they got it right.
  const hasPublishedSolution = !!solution;

  const { error } = await supabase.from("user_submissions").upsert(
    {
      user_id: profile.id,
      problem_id: problemId,
      answer: answer.trim() || null,
      is_correct: true,   // self-reported: clicking "I got it" means correct
      submitted_at: new Date().toISOString()
    },
    { onConflict: "user_id,problem_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/problems/${problemId}`);
  revalidatePath("/dashboard");

  return { hasPublishedSolution };
}

export async function unsubmitAnswer(problemId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("You must be signed in.");

  const supabase = await createClient();

  const { error } = await supabase
    .from("user_submissions")
    .delete()
    .eq("user_id", profile.id)
    .eq("problem_id", problemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/problems/${problemId}`);
  revalidatePath("/dashboard");
}