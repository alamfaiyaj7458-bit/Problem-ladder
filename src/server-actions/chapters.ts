"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function createChapter(unitId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Chapter name is required");

  const { error } = await supabase.from("chapters").insert({
    unit_id: unitId,
    name,
    slug: slugify(name),
    description
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/units/${unitId}`);
}

export async function updateChapter(chapterId: string, unitId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Chapter name is required");

  const { error } = await supabase
    .from("chapters")
    .update({ name, description })
    .eq("id", chapterId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/units/${unitId}`);
}

export async function deleteChapter(chapterId: string, unitId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/units/${unitId}`);
}
