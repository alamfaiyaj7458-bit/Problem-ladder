import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/gemini/client";
import { verifySolutionResponseSchema, verifySolutionZodSchema } from "@/lib/gemini/schemas";
import { verifySolutionPrompt } from "@/lib/gemini/prompts";

export const runtime = "edge";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { statement, solution } = await request.json();
  if (!statement || !solution) {
    return NextResponse.json({ error: "statement and solution are required" }, { status: 400 });
  }

  const { system, prompt } = verifySolutionPrompt({ statement, solution });

  try {
    const raw = await generateStructured<unknown>({
      system,
      prompt,
      schema: verifySolutionResponseSchema,
      temperature: 0.2
    });
    const parsed = verifySolutionZodSchema.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}