import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/gemini/client";
import { suggestOptionsResponseSchema, suggestOptionsZodSchema } from "@/lib/gemini/schemas";
import { suggestOptionsPrompt } from "@/lib/gemini/prompts";

export const runtime = "edge";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { title, statement, solutionContent } = await request.json();
  if (!title || !statement) {
    return NextResponse.json({ error: "title and statement are required" }, { status: 400 });
  }

  const { system, prompt } = suggestOptionsPrompt({ title, statement, solutionContent });

  try {
    const raw = await generateStructured<unknown>({ system, prompt, schema: suggestOptionsResponseSchema });
    const parsed = suggestOptionsZodSchema.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}