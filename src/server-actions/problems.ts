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

/**
 * Reads `option_0..option_3` + `correct_option` off a submitted form.
 * Returns null for `options`/`correct_option` if fewer than 2 non-empty
 * choices were given — callers decide whether that's acceptable (drafts
 * can be incomplete; publishing cannot, see publishing.ts).
 */
function parseOptions(formData: FormData): { options: string[] | null; correct_option: number | null } {
  const raw = [0, 1, 2, 3].map((i) => String(formData.get(`option_${i}`) ?? "").trim());
  const options = raw.filter(Boolean);
  if (options.length < 2) return { options: null, correct_option: null };

  const correctRaw = formData.get("correct_option");
  const correctIdxIntoRaw = correctRaw === null ? -1 : Number(correctRaw);
  // correctIdxIntoRaw indexes into the original 4 slots (raw), which may
  // include blanks — translate it to an index into the filtered `options`.
  const correct_option = correctIdxIntoRaw >= 0 && raw[correctIdxIntoRaw]?.trim()
    ? options.indexOf(raw[correctIdxIntoRaw].trim())
    : -1;

  return { options, correct_option: correct_option >= 0 ? correct_option : null };
}

export async function createProblem(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const chapter_id = String(formData.get("chapter_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const statement = String(formData.get("statement") ?? "").trim();
  const difficulty_score = Number(formData.get("difficulty_score") ?? 0);
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const { options, correct_option } = parseOptions(formData);

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
      options,
      correct_option,
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
  const { options, correct_option } = parseOptions(formData);

  if (!title || !statement) throw new Error("Title and statement are required");

  const { error } = await supabase
    .from("problems")
    .update({ title, statement, difficulty_score, tags, source_notes, options, correct_option })
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