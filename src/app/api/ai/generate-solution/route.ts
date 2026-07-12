import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/gemini/client";
import { generateSolutionResponseSchema, generateSolutionZodSchema } from "@/lib/gemini/schemas";
import { generateSolutionPrompt } from "@/lib/gemini/prompts";

export const runtime = "edge";
export const maxDuration = 60;

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

  const { system, prompt } = generateSolutionPrompt({ title, statement });

  try {
    const raw = await generateStructured<unknown>({
      system,
      prompt,
      schema: generateSolutionResponseSchema,
      temperature: 0.4
    });
    const parsed = generateSolutionZodSchema.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}