import { z } from "zod";

// ---------------------------------------------------------------------------
// Each AI task gets a Gemini responseSchema (forces the shape of the model's
// output) AND a Zod schema (validates it again on our side before it ever
// touches the database). Belt and suspenders — the model is never trusted
// on shape alone.
// ---------------------------------------------------------------------------

// --- Categorize: pick an existing chapter, assign difficulty + tags -------

export const categorizeResponseSchema = {
  type: "object",
  properties: {
    chapter_id: { type: "string", description: "Must be exactly one of the provided chapter IDs." },
    difficulty_score: { type: "number", description: "0 to 100." },
    tags: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
    reasoning: { type: "string", description: "One sentence explaining the chapter and difficulty choice." }
  },
  required: ["chapter_id", "difficulty_score", "tags", "reasoning"]
};

export const categorizeZodSchema = z.object({
  chapter_id: z.string().uuid(),
  difficulty_score: z.number().min(0).max(100),
  tags: z.array(z.string().min(1)).min(1).max(10),
  reasoning: z.string()
});

export type CategorizeResult = z.infer<typeof categorizeZodSchema>;

// --- Generate problems: batch creation within one chapter ------------------

export const generatedProblemSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    statement: { type: "string", description: "The full problem statement, self-contained, no answer included." },
    difficulty_score: { type: "number" },
    tags: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 }
  },
  required: ["title", "statement", "difficulty_score", "tags"]
};

export const generateProblemsResponseSchema = {
  type: "object",
  properties: {
    problems: { type: "array", items: generatedProblemSchema }
  },
  required: ["problems"]
};

export const generatedProblemZodSchema = z.object({
  title: z.string().min(3),
  statement: z.string().min(10),
  difficulty_score: z.number().min(0).max(100),
  tags: z.array(z.string().min(1)).min(1).max(10)
});

export const generateProblemsZodSchema = z.object({
  problems: z.array(generatedProblemZodSchema).min(1)
});

export type GeneratedProblem = z.infer<typeof generatedProblemZodSchema>;

// --- Solution generation ----------------------------------------------------

export const generateSolutionResponseSchema = {
  type: "object",
  properties: {
    content: { type: "string", description: "A complete, well-explained solution in plain text/markdown." }
  },
  required: ["content"]
};

export const generateSolutionZodSchema = z.object({
  content: z.string().min(10)
});

// --- Solution verification --------------------------------------------------

export const verifySolutionResponseSchema = {
  type: "object",
  properties: {
    is_correct: { type: "boolean" },
    issues: { type: "array", items: { type: "string" }, description: "Empty array if no issues." }
  },
  required: ["is_correct", "issues"]
};

export const verifySolutionZodSchema = z.object({
  is_correct: z.boolean(),
  issues: z.array(z.string())
});

// --- Solution critique + fix -------------------------------------------------

export const critiqueSolutionResponseSchema = {
  type: "object",
  properties: {
    critique: { type: "string" },
    suggested_fixes: { type: "array", items: { type: "string" } }
  },
  required: ["critique", "suggested_fixes"]
};

export const critiqueSolutionZodSchema = z.object({
  critique: z.string(),
  suggested_fixes: z.array(z.string())
});

export const fixSolutionResponseSchema = generateSolutionResponseSchema;
export const fixSolutionZodSchema = generateSolutionZodSchema;

// --- Internet discovery candidates -------------------------------------------

export const discoveryCandidateZodSchema = z.object({
  title: z.string().min(3),
  statement: z.string().min(10),
  source_url: z.string().url().nullable().optional(),
  suggested_difficulty_score: z.number().min(0).max(100),
  suggested_tags: z.array(z.string().min(1)).min(1).max(10)
});

export const discoveryResponseZodSchema = z.object({
  candidates: z.array(discoveryCandidateZodSchema).min(0)
});

export type DiscoveryCandidate = z.infer<typeof discoveryCandidateZodSchema>;
