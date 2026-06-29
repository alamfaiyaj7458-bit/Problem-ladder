import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BASE_SYSTEM = `You are a math tutor. Give a single, complete, self-contained hint that nudges the student toward the right approach without revealing the answer or full solution steps. Write exactly one paragraph of 2-4 sentences. Plain text only, no markdown, no LaTeX. Always finish your sentence — never cut off mid-thought.`;

export async function POST(request: Request) {
  // Any signed-in user can request a hint
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Sign in to get hints." }, { status: 401 });
  }

  const { title, statement } = await request.json();
  if (!title || !statement) {
    return NextResponse.json({ error: "title and statement are required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: BASE_SYSTEM }] },
    contents: [{
      role: "user",
      parts: [{ text: `Problem: ${title}\n\n${statement}` }]
    }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 512 }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  const data = await res.json();
  const hint: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "No hint available.";

  return NextResponse.json({ hint });
}