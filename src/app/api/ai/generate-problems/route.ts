import { NextResponse } from "next/server";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/gemini/client";
import { generateProblemsResponseSchema, generateProblemsZodSchema } from "@/lib/gemini/schemas";
import { generateProblemsPrompt } from "@/lib/gemini/prompts";
import type { DifficultyLevel } from "@/lib/types";

const VALID_LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced", "expert", "master"];

export async function POST(request: Request) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { chapterId, level, count } = await request.json();

  if (!chapterId || !VALID_LEVELS.includes(level) || !count || count < 1 || count > 50) {
    return NextResponse.json(
      { error: "chapterId, a valid level, and a count between 1 and 50 are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id, name, description, unit_id, units(name)")
    .eq("id", chapterId)
    .single();

  if (chapterError || !chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const unitName = (chapter as unknown as { units: { name: string } }).units?.name ?? "";
  const { system, prompt } = generateProblemsPrompt({
    unitName,
    chapterName: chapter.name,
    chapterDescription: chapter.description,
    level,
    count
  });

  try {
    const raw = await generateStructured<unknown>({
      system,
      prompt,
      schema: generateProblemsResponseSchema,
      temperature: 0.7
    });
    const parsed = generateProblemsZodSchema.parse(raw);

    const rows = parsed.problems.map((p) => ({
      chapter_id: chapterId,
      title: p.title,
      statement: p.statement,
      difficulty_score: Math.min(100, Math.max(0, p.difficulty_score)),
      tags: p.tags.map((t) => t.toLowerCase().trim()),
      status: "draft" as const,
      source: "ai_generated" as const,
      created_by: profile.id
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("problems")
      .insert(rows)
      .select("id");
    if (insertError) throw insertError;

    await supabase.from("ai_generation_jobs").insert({
      unit_id: chapter.unit_id,
      chapter_id: chapterId,
      target_level: level,
      requested_count: count,
      generated_count: inserted?.length ?? 0,
      status: (inserted?.length ?? 0) === count ? "completed" : "partial",
      created_by: profile.id
    });

    return NextResponse.json({ generatedCount: inserted?.length ?? 0, problemIds: inserted?.map((p) => p.id) ?? [] });
  } catch (err) {
    await supabase.from("ai_generation_jobs").insert({
      unit_id: chapter.unit_id,
      chapter_id: chapterId,
      target_level: level,
      requested_count: count,
      generated_count: 0,
      status: "failed",
      error_message: (err as Error).message,
      created_by: profile.id
    });
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
