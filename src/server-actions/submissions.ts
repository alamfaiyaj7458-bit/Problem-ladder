"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

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

export async function submitVerifiedAnswer(
  problemId: string,
  answer: string,
  isCorrect: boolean
) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("You must be signed in.");

  const supabase = await createClient();

  const { error } = await supabase.from("user_submissions").upsert(
    {
      user_id: profile.id,
      problem_id: problemId,
      answer: answer.trim() || null,
      is_correct: isCorrect,
      submitted_at: new Date().toISOString()
    },
    { onConflict: "user_id,problem_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/problems/${problemId}`);
  revalidatePath("/dashboard");
}