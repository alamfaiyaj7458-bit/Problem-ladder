"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, requireAdmin } from "@/lib/supabase/server";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export async function createProblem(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const chapter_id = String(formData.get("chapter_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const statement = String(formData.get("statement") ?? "").trim();
  const difficulty_score = Number(formData.get("difficulty_score") ?? 0);
  const tags = parseTags(String(formData.get("tags") ?? ""));

  if (!chapter_id || !title || !statement) {
    throw new Error("Chapter, title, and statement are required");
  }

  const { data, error } = await supabase
    .from("problems")
    .insert({
      chapter_id,
      title,
      statement,
      difficulty_score,
      tags,
      source: "manual",
      status: "draft",
      created_by: profile.id
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/problems");
  redirect(`/admin/problems/${data.id}`);
}

export async function updateProblem(problemId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const statement = String(formData.get("statement") ?? "").trim();
  const difficulty_score = Number(formData.get("difficulty_score") ?? 0);
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const source_notes = String(formData.get("source_notes") ?? "").trim() || null;

  if (!title || !statement) throw new Error("Title and statement are required");

  const { error } = await supabase
    .from("problems")
    .update({ title, statement, difficulty_score, tags, source_notes })
    .eq("id", problemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/problems/${problemId}`);
  revalidatePath("/admin/problems");
}

export async function deleteProblem(problemId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("problems").delete().eq("id", problemId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/problems");
  redirect("/admin/problems");
}
