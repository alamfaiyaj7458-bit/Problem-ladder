import { NextResponse } from "next/server";
import { requireAdmin, createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/gemini/client";
import { generateSolutionResponseSchema, generateSolutionZodSchema } from "@/lib/gemini/schemas";
import { generateSolutionPrompt } from "@/lib/gemini/prompts";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { problemIds } = await request.json();
  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    return NextResponse.json({ error: "problemIds array is required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch all requested problems
  const { data: problems } = await supabase
    .from("problems")
    .select("id, title, statement")
    .in("id", problemIds);

  if (!problems || problems.length === 0) {
    return NextResponse.json({ error: "No problems found" }, { status: 404 });
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];

  // Generate + save solutions sequentially to avoid rate-limit hammering
  for (const problem of problems) {
    try {
      const { system, prompt } = generateSolutionPrompt({
        title: problem.title,
        statement: problem.statement
      });

      const raw = await generateStructured<unknown>({
        system,
        prompt,
        schema: generateSolutionResponseSchema,
        temperature: 0.4
      });

      const parsed = generateSolutionZodSchema.parse(raw);

      const { error } = await supabase.from("solutions").upsert(
        {
          problem_id: problem.id,
          content: parsed.content,
          source: "ai_generated",
          status: "draft"
        },
        { onConflict: "problem_id" }
      );

      if (error) throw new Error(error.message);
      results.push({ id: problem.id, ok: true });
    } catch (err) {
      results.push({ id: problem.id, ok: false, error: (err as Error).message });
    }
  }

  return NextResponse.json({ results });
}
