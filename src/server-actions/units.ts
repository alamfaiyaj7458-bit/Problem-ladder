"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function createUnit(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Unit name is required");

  const { error } = await supabase.from("units").insert({
    name,
    slug: slugify(name),
    description
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/units");
  revalidatePath("/");
}

export async function updateUnit(unitId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Unit name is required");

  const { error } = await supabase
    .from("units")
    .update({ name, description })
    .eq("id", unitId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/units");
  revalidatePath("/");
}

export async function deleteUnit(unitId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("units").delete().eq("id", unitId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/units");
  revalidatePath("/");
}
