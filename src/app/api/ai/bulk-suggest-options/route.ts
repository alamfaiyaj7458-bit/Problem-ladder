import { NextResponse } from "next/server";
import { requireAdmin, createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/gemini/client";
import { suggestOptionsResponseSchema, suggestOptionsZodSchema } from "@/lib/gemini/schemas";
import { suggestOptionsPrompt } from "@/lib/gemini/prompts";

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

  // Fetch problems + their published solution (if any) so the suggester can
  // ground its answer on the worked solution instead of re-deriving it.
  const { data: problems } = await supabase
    .from("problems")
    .select("id, title, statement")
    .in("id", problemIds);

  if (!problems || problems.length === 0) {
    return NextResponse.json({ error: "No problems found" }, { status: 404 });
  }

  const { data: solutions } = await supabase
    .from("solutions")
    .select("problem_id, content")
    .in("problem_id", problemIds);

  const solutionByProblem = new Map((solutions ?? []).map((s) => [s.problem_id, s.content]));

  const results: { id: string; ok: boolean; error?: string }[] = [];

  // Sequential, same as bulk-generate-solutions, to avoid rate-limit hammering.
  for (const problem of problems) {
    try {
      const { system, prompt } = suggestOptionsPrompt({
        title: problem.title,
        statement: problem.statement,
        solutionContent: solutionByProblem.get(problem.id) ?? undefined
      });

      const raw = await generateStructured<unknown>({
        system,
        prompt,
        schema: suggestOptionsResponseSchema,
        temperature: 0.4
      });

      const parsed = suggestOptionsZodSchema.parse(raw);

      const { error } = await supabase
        .from("problems")
        .update({ options: parsed.options, correct_option: parsed.correct_option })
        .eq("id", problem.id);

      if (error) throw new Error(error.message);
      results.push({ id: problem.id, ok: true });
    } catch (err) {
      results.push({ id: problem.id, ok: false, error: (err as Error).message });
    }
  }

  return NextResponse.json({ results });
}