import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/gemini/client";
import { fixSolutionResponseSchema, fixSolutionZodSchema } from "@/lib/gemini/schemas";
import { fixSolutionPrompt } from "@/lib/gemini/prompts";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { statement, solution, critique, fixes } = await request.json();
  if (!statement || !solution || !critique || !Array.isArray(fixes)) {
    return NextResponse.json(
      { error: "statement, solution, critique, and fixes[] are required" },
      { status: 400 }
    );
  }

  const { system, prompt } = fixSolutionPrompt({ statement, solution, critique, fixes });

  try {
    const raw = await generateStructured<unknown>({
      system,
      prompt,
      schema: fixSolutionResponseSchema,
      temperature: 0.3
    });
    const parsed = fixSolutionZodSchema.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
