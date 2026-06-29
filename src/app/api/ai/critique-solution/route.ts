import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/gemini/client";
import { critiqueSolutionResponseSchema, critiqueSolutionZodSchema } from "@/lib/gemini/schemas";
import { critiqueSolutionPrompt } from "@/lib/gemini/prompts";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { statement, solution, issues } = await request.json();
  if (!statement || !solution || !Array.isArray(issues)) {
    return NextResponse.json({ error: "statement, solution, and issues[] are required" }, { status: 400 });
  }

  const { system, prompt } = critiqueSolutionPrompt({ statement, solution, issues });

  try {
    const raw = await generateStructured<unknown>({
      system,
      prompt,
      schema: critiqueSolutionResponseSchema,
      temperature: 0.3
    });
    const parsed = critiqueSolutionZodSchema.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
