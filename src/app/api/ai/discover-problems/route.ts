import { NextResponse } from "next/server";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import { generateWithSearchGrounding, extractJsonBlock } from "@/lib/gemini/client";
import { discoveryResponseZodSchema } from "@/lib/gemini/schemas";
import { discoverProblemsPrompt } from "@/lib/gemini/prompts";

export const runtime = "edge";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { unitId, chapterId, count } = await request.json();
  if (!unitId || !chapterId || !count || count < 1 || count > 15) {
    return NextResponse.json(
      { error: "unitId, chapterId, and a count between 1 and 15 are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("name, units(name)")
    .eq("id", chapterId)
    .single();
  if (chapterError || !chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }
  const unitName = (chapter as unknown as { units: { name: string } }).units?.name ?? "";

  const { system, prompt } = discoverProblemsPrompt({ unitName, chapterName: chapter.name, count });

  try {
    const { text } = await generateWithSearchGrounding({ system, prompt });
    const raw = extractJsonBlock<unknown>(text);
    const parsed = discoveryResponseZodSchema.parse(raw);

    if (parsed.candidates.length === 0) {
      return NextResponse.json({ insertedCount: 0, message: "No verifiable candidates found." });
    }

    const rows = parsed.candidates.map((c) => ({
      unit_id: unitId,
      chapter_id: chapterId,
      title: c.title,
      statement: c.statement,
      source_url: c.source_url ?? null,
      suggested_difficulty_score: c.suggested_difficulty_score,
      suggested_tags: c.suggested_tags.map((t) => t.toLowerCase().trim()),
      status: "pending" as const
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("problem_candidates")
      .insert(rows)
      .select("id");
    if (insertError) throw insertError;

    return NextResponse.json({ insertedCount: inserted?.length ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}