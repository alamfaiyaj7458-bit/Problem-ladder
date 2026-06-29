// Thin wrapper around the Gemini API. Two call shapes are exposed:
//
//  - generateStructured: forces the model to return JSON matching an exact
//    schema (Gemini's `responseSchema`). This is the backbone of "strong
//    constraints around AI outputs" — the model never gets to freeform a
//    shape we then hope to parse.
//
//  - generateWithSearchGrounding: used only for internet problem discovery,
//    where the model needs to actually search the web. Grounding and strict
//    responseSchema don't reliably combine across API versions, so this path
//    asks for a fenced JSON block in plain text and parses it defensively —
//    see extractJsonBlock below.

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

export class GeminiError extends Error {}

interface StructuredArgs {
  system: string;
  prompt: string;
  // JSON Schema (OpenAPI-subset) describing the exact required shape.
  schema: Record<string, unknown>;
  temperature?: number;
}

export async function generateStructured<T>(args: StructuredArgs): Promise<T> {
  const { system, prompt, schema, temperature = 0.4 } = args;

  const res = await fetch(`${BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new GeminiError(`Gemini request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiError("Gemini returned no content");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GeminiError("Gemini did not return valid JSON for the requested schema");
  }
}

interface SearchGroundedResult {
  text: string;
  sourceUrls: string[];
}

export async function generateWithSearchGrounding(args: {
  system: string;
  prompt: string;
}): Promise<SearchGroundedResult> {
  const res = await fetch(`${BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: args.system }] },
      contents: [{ role: "user", parts: [{ text: args.prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.3 }
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new GeminiError(`Gemini request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text: string = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("\n") ?? "";

  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const sourceUrls: string[] = groundingChunks
    .map((c: { web?: { uri?: string } }) => c.web?.uri)
    .filter((u: string | undefined): u is string => Boolean(u));

  return { text, sourceUrls };
}

/** Pulls the first fenced ```json ... ``` block (or bare JSON) out of free text. */
export function extractJsonBlock<T>(text: string): T {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? text;
  try {
    return JSON.parse(candidate.trim()) as T;
  } catch {
    throw new GeminiError("Could not parse a JSON block out of the model's response");
  }
}
