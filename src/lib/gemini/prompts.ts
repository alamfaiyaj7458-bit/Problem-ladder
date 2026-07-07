import type { DifficultyLevel } from "@/lib/types";
import { DIFFICULTY_LABEL } from "@/lib/difficulty";

const BASE_SYSTEM = `You are the content engine for Problem Ladder Engine, a problem-solving
platform for students. You generate and evaluate math/problem-solving content
with precision. You never invent new units or chapters — you only choose from
the exact list you are given. You always follow the requested output schema
exactly and return nothing but that JSON.`;

export function categorizePrompt(args: {
  title: string;
  statement: string;
  chapters: { id: string; name: string; unit_name: string }[];
}) {
  const chapterList = args.chapters
    .map((c) => `- id: ${c.id} | ${c.unit_name} > ${c.name}`)
    .join("\n");

  return {
    system: BASE_SYSTEM,
    prompt: `Categorize the following problem.

Problem title: ${args.title}
Problem statement: ${args.statement}

Choose the single best-fitting chapter_id from this exact list (do not invent
a new one, do not modify the id):
${chapterList}

Assign a difficulty_score from 0 (trivial) to 100 (extremely hard, olympiad
final-round level). Assign 2-8 concrete concept tags a student might search
for (e.g. "cyclic quadrilateral", "vieta", "pigeonhole"), lowercase, no
duplicates.`
  };
}

// --- Suggest MCQ options for a single problem -------------------------------

export function suggestOptionsPrompt(args: { title: string; statement: string; solutionContent?: string }) {
  const solutionSection = args.solutionContent
    ? `\n\nWorked solution (use this to determine the correct answer precisely):\n${args.solutionContent}`
    : "";

  return {
    system: BASE_SYSTEM,
    prompt: `Write 4 multiple-choice answer options for the following problem.

Problem title: ${args.title}
Problem statement: ${args.statement}${solutionSection}

Solve the problem yourself first, then produce exactly 4 answer choices in
\`options\` and the 0-based index of the correct one in \`correct_option\`.

The 3 incorrect choices (distractors) must be plausible — each should reflect
a specific, realistic mistake (a sign error, an off-by-one, using the wrong
formula, stopping one step early, a common misconception), not a random or
obviously-wrong value. A student who made that particular mistake should
land on that exact distractor.

Keep all 4 choices similar in format, length, and style to each other so the
correct one isn't identifiable just by looking different. Use the same LaTeX
math formatting conventions as the statement ($...$ for inline math) when a
choice contains a mathematical expression.`
  };
}

export function generateProblemsPrompt(args: {
  unitName: string;
  chapterName: string;
  chapterDescription: string | null;
  level: DifficultyLevel;
  count: number;
}) {
  return {
    system: BASE_SYSTEM,
    prompt: `Generate ${args.count} original practice problems for:

Unit: ${args.unitName}
Chapter: ${args.chapterName}
${args.chapterDescription ? `Chapter focus: ${args.chapterDescription}` : ""}
Target difficulty level: ${DIFFICULTY_LABEL[args.level]}

Requirements for every problem:
- Self-contained: a student can solve it from the statement alone.
- No answer or solution included in the statement.
- Each difficulty_score should fall within the band typically associated with
  "${DIFFICULTY_LABEL[args.level]}" (beginner ~0-19, intermediate ~20-39,
  advanced ~40-59, expert ~60-79, master ~80-100).
- 2-8 concrete concept tags per problem, lowercase.
- No two generated problems should be near-duplicates of each other.

ANSWER CHOICES (required, multiple choice):
- Provide exactly 4 answer choices in \`options\` and the 0-based index of
  the correct one in \`correct_option\`.
- The 3 incorrect choices (distractors) must be plausible — each should
  reflect a specific, realistic mistake (a sign error, an off-by-one, using
  the wrong formula, a common misconception), not random or obviously wrong
  values. A student who made that particular mistake should land on that
  exact distractor.
- Keep all 4 choices similar in format, length, and style to each other so
  the correct one isn't identifiable just by looking different.
- Randomize which index holds the correct answer across problems — don't
  default to always putting it first or in the same position.
- Write each option using the same LaTeX math formatting rules as the
  statement (see below) when it contains a mathematical expression.

MATH FORMATTING IN STATEMENTS (required):
- ALL mathematical expressions must be written in LaTeX — never plain text.
- Inline math for variables and short expressions: $a^2 - 3a + 1 = 0$
- Display math for standalone equations or large expressions:
$$
\\frac{2a^5 - 5a^4 + 2a^3 - 8a^2}{a^2 + 1}
$$
- Display math: opening $$ on its own line, equation on next line, closing $$ on its own line.
- Never write: a^2, sqrt(x), (a+b)/c, theta, alpha — always use $a^2$, $\\sqrt{x}$, $\\frac{a+b}{c}$, $\\theta$, $\\alpha$.
- Use: \\frac{}{}, \\sqrt{}, \\binom{}{}, \\sum, \\int, \\theta, \\alpha, \\beta, \\pi, \\leq, \\geq, \\neq, \\cdot, \\times, \\pm`
  };
}

export function generateSolutionPrompt(args: { title: string; statement: string }) {
  return {
    system: `You are a senior mathematics author preparing solutions for a premium digital textbook. Your solutions appear on a platform that renders Markdown and KaTeX. You write with the precision and elegance of a professional mathematician — every sentence earns its place, every equation flows naturally from the last.`,
    prompt: `Write a complete, elegant solution to this problem.

Problem: ${args.statement}

━━━ STYLE GUIDE ━━━

Write the solution as one continuous mathematical derivation — not a checklist.

GOOD: A flowing argument where each equation leads naturally to the next.
BAD: "Step 1: Differentiate. Step 2: Substitute. Step 3: Simplify."

Rules:
- No generic headings like "Step 1", "Differentiate", "Substitute", "Simplify", "Calculate", "Solution", "Observation".
- No numbered or bulleted lists for the main derivation.
- Guide the reader with minimal, precise prose between equations.
- Every sentence must have a clear mathematical purpose. Cut everything else.
- Never state the obvious. Never explain trivial algebra.
- Do not repeat a calculation. Each result appears exactly once.
- The derivation should read like a proof in a textbook: economical, confident, precise.

EXAMPLE OF THE TARGET STYLE (for a different problem — do not copy):

Since $a$ satisfies $a^2 - 3a + 1 = 0$, we have $a^2 + 1 = 3a$ and, dividing by $a$,

$$
a + \\frac{1}{a} = 3.
$$

Polynomial division gives

$$
\\frac{2a^5 - 5a^4 + 2a^3 - 8a^2}{a^2+1} = 2a^3 - 5a^2 - 3 + \\frac{3}{a^2+1}.
$$

Substituting $a^2 = 3a-1$ repeatedly reduces the polynomial part to $a - 4$, so the expression equals

$$
a + \\frac{1}{a} - 4 = 3 - 4 = -1.
$$

━━━ STRUCTURE ━━━

Write flowing prose + equations. Then end with exactly:

FINAL_ANSWER: <the answer, using $...$ math if needed>
TAKEAWAY: <one precise sentence — a mathematical insight, not a procedure description>

━━━ MATH FORMAT ━━━

All math in LaTeX. Rules:
- Inline: $x^2 - 1$, $\\frac{dy}{dx}$, $\\theta$
- Display (important equations, results, derivation steps):

$$
\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
$$

- EVERY $$ must be on its own line. Opening $$ on one line, equation on the next, closing $$ on the next. Never on the same line as the equation.
- Blank line before and after every display equation block.
- ONE equation per $$ block.
- Never use \\begin{array}, \\begin{tabular}, \\begin{matrix}.
- Use: \\frac{}{}, \\sqrt{}, \\binom{}{}, \\sum, \\int, \\lim, \\infty, \\cdot, \\times, \\pm, \\leq, \\geq, \\neq, \\implies, \\theta, \\alpha, \\beta, \\pi, \\mathbb{R}, \\mathbb{Z}`
  };
}

export function verifySolutionPrompt(args: { statement: string; solution: string }) {
  return {
    system: BASE_SYSTEM,
    prompt: `Verify whether this solution is fully correct and complete.

Problem: ${args.statement}
Proposed solution: ${args.solution}

Check the logic and the final answer carefully. List every concrete issue you
find (a wrong step, an unjustified leap, a wrong final answer, a missing
case). If there are no issues, return an empty issues array and is_correct
true.`
  };
}

export function critiqueSolutionPrompt(args: { statement: string; solution: string; issues: string[] }) {
  return {
    system: BASE_SYSTEM,
    prompt: `This solution has known issues. Critique it and propose concrete fixes.

Problem: ${args.statement}
Solution: ${args.solution}
Known issues: ${args.issues.join("; ")}

Write a short critique explaining what's wrong and why, then a list of
concrete, actionable fixes (not a rewritten solution yet).`
  };
}

export function fixSolutionPrompt(args: {
  statement: string;
  solution: string;
  critique: string;
  fixes: string[];
}) {
  return {
    system: `You are a senior mathematics author preparing solutions for a premium digital textbook. Your solutions appear on a platform that renders Markdown and KaTeX.`,
    prompt: `Rewrite this solution to correct all issues. Produce a flowing mathematical derivation — not a checklist.

Problem: ${args.statement}
Original solution: ${args.solution}
Issues to fix: ${args.fixes.join("; ")}

Write as one continuous derivation with minimal guiding prose and display equations using the same LaTeX format:
- Inline math: $x^2$
- Display equations (each on its own $$ block with blank lines around it):

$$
equation
$$

End with:
FINAL_ANSWER: <answer>
TAKEAWAY: <one precise mathematical insight>`
  };
}

export function discoverProblemsPrompt(args: {
  unitName: string;
  chapterName: string;
  count: number;
}) {
  return {
    system: `${BASE_SYSTEM} For this task you have web search available. Search for
real, existing problems (e.g. from competitions, problem archives, textbooks)
that match the requested topic. Always record the source URL you found each
problem at. Never fabricate a source URL.`,
    prompt: `Find ${args.count} existing, real problems about:

Unit: ${args.unitName}
Chapter: ${args.chapterName}

For each one, search the web, confirm it's a real published problem, and note
exactly where you found it.

After researching, respond with ONLY a fenced JSON code block (\`\`\`json ... \`\`\`)
matching this exact shape and nothing else outside the fence:

{
  "candidates": [
    {
      "title": "string",
      "statement": "string, the full problem statement",
      "source_url": "string, the exact URL where you found it",
      "suggested_difficulty_score": 0-100,
      "suggested_tags": ["string", "..."]
    }
  ]
}

If you cannot confidently find ${args.count} real problems with verifiable
sources, return fewer rather than inventing any.`
  };
}