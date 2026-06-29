import { NextResponse } from "next/server";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/gemini/client";
import { categorizeResponseSchema, categorizeZodSchema } from "@/lib/gemini/schemas";
import { categorizePrompt } from "@/lib/gemini/prompts";
import { scoreToLevel } from "@/lib/difficulty";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { title, statement } = await request.json();
  if (!title || !statement) {
    return NextResponse.json({ error: "title and statement are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, name, units(name)")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const chapterList = (chapters ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    unit_name: (c as unknown as { units: { name: string } }).units?.name ?? ""
  }));

  if (chapterList.length === 0) {
    return NextResponse.json({ error: "No chapters exist yet — create one first." }, { status: 400 });
  }

  const { system, prompt } = categorizePrompt({ title, statement, chapters: chapterList });

  try {
    const raw = await generateStructured<unknown>({ system, prompt, schema: categorizeResponseSchema });
    const parsed = categorizeZodSchema.parse(raw);

    // The model must choose a chapter we actually offered it — never trust blindly.
    const validChapterIds = new Set(chapterList.map((c) => c.id));
    if (!validChapterIds.has(parsed.chapter_id)) {
      return NextResponse.json(
        { error: "The AI chose a chapter outside the provided list. Please categorize manually." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      chapter_id: parsed.chapter_id,
      difficulty_score: parsed.difficulty_score,
      difficulty_level: scoreToLevel(parsed.difficulty_score),
      tags: parsed.tags,
      reasoning: parsed.reasoning
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
