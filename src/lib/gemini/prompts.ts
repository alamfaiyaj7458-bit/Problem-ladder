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
duplicates.

You are an expert mathematics educator and competition problem analyst.

Your task is to analyze a mathematics problem and classify it accurately.

You must determine:

1. Subject
2. Main Topic
3. Subtopic
4. Concepts Required
5. Techniques Required
6. Difficulty (1-100)
7. Estimated Solve Time (minutes)
8. Common Mistakes
9. Prerequisites

Difficulty Guidelines

1-20
Very easy. Direct substitution or one-step calculation.

21-40
Basic application of one concept.

41-60
Requires understanding and combining ideas.

61-80
Multi-step reasoning, hidden observations, or creative application.

81-100
Olympiad-level insight or advanced mathematical reasoning.


`
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

MATH FORMATTING IN STATEMENTS (required):
- ALL mathematical expressions must be written in LaTeX — never plain text.
- Inline math for variables and short expressions: $a^2 - 3a + 1 = 0$
- Display math for standalone equations or large expressions:
$$
\\frac{2a^5 - 5a^4 + 2a^3 - 8a^2}{a^2 + 1}
$$
- Display math: opening $$ on its own line, equation on next line, closing $$ on its own line.
- Never write: a^2, sqrt(x), (a+b)/c, theta, alpha — always use $a^2$, $\\sqrt{x}$, $\\frac{a+b}{c}$, $\\theta$, $\\alpha$.
- Use: \\frac{}{}, \\sqrt{}, \\binom{}{}, \\sum, \\int, \\theta, \\alpha, \\beta, \\pi, \\leq, \\geq, \\neq, \\cdot, \\times, \\pm

You are a senior mathematics textbook author.

Your objective is to generate ORIGINAL mathematics problems.

- Never copy existing textbook problems.
- Create mathematically correct problems.
- Use natural mathematical language.
- Use LaTeX where appropriate.
- Avoid ambiguity.
- There must be exactly one correct answer unless otherwise specified.
- Numbers should be chosen carefully.
- The difficulty must closely match the requested difficulty.
- Problems should test understanding rather than memorization.
- Do not generate trick questions.

difficulty categorization according to difficulty score:
1-20
Direct formula application.

21-40
Basic conceptual understanding.

41-60
Multiple concepts.

61-80
Non-trivial reasoning.

81-100
Creative insight.


`
  };
}

export function generateSolutionPrompt(args: { title: string; statement: string }) {
  return {
    system: BASE_SYSTEM,
    prompt: `Solve this problem step by step. Write for a student who is learning.

Title: ${args.title}
Statement: ${args.statement}

━━━ OUTPUT FORMAT (follow exactly) ━━━

Use this structure only.

## Solution

### Step 1: [Short Title]

(Optional justification — maximum 5 words.)

$$
equation
$$

$$
next\ equation
$$

### Step 2: [Short Title]

(Optional justification — maximum 5 words.)

$$
equation
$$

Continue until the solution is complete.

Answer

FINAL_ANSWER: the answer (use $...$ for inline math e.g. $x = 5$)
TAKEAWAY: One sentence the student should remember.


━━━ WRITING RULES ━━━
* One step per line. (critical)
* The solution should read like an official examination answer.
* Prefer equations over words.
* Every sentence must contain at most **5 words**.
* Never write paragraphs.
* Never explain obvious algebra.
* Never repeat information already shown mathematically.
* Never describe what you are about to do.
* Never summarize what you just did.
* Never include introductions or conclusions.
* Solution step by step but no written "step 1, step 2 etc".(Critical)

Forbidden headings:

* Idea
* Approach
* Observation
* Explanation
* Discussion
* Final Simplification
* Note
* Alternative Method

Forbidden phrases:

* We know
* We observe
* Notice that
* Let us
* Clearly
* Since we are given
* The idea is
* The core idea
* This means that
* Therefore we can
* Hence we obtain
* From the above
* It follows that

Allowed justifications:

* Factorise
* Substitute values
* Apply Vieta's formulas
* Zero Product Property
* Quadratic formula
* Expand
* Simplify
* Rearrange
* Differentiate
* Integrate

━━━ MATHEMATICS RULES ━━━

* ALL mathematics must be written in LaTeX.
* Use display equations whenever possible.
* Consecutive algebraic manipulations should be shown as separate equations.
* Skip trivial arithmetic.
* Do not explain intermediate calculations unless mathematically necessary.
* Never use tables or LaTeX array environments.


Important:
FINAL_ANSWER: the answer (use $...$ for inline math e.g. $x = 5$)
TAKEAWAY: One sentence the student should remember.

━━━ MATH RULES ━━━
- ALL math in LaTeX.
- Inline: $a^2 = 3a - 1$
- Display equations: opening $$ on its own line, equation on next line, closing $$ on its own line. Like this:

$$
a^2 + 1 = 3a
$$

- NEVER put $$ on the same line as the equation.
- NEVER use \\begin{array}, \\begin{tabular}, \\begin{matrix} or any LaTeX table/array environments. They do not render.
- For polynomial long division: describe each step in prose + individual equations. No tables.
- Use: \\frac{}{}, \\sqrt{}, \\cdot, \\leq, \\geq, \\implies, \\neq, \\theta, \\alpha, \\beta, \\pm

━━━ PROSE RULES ━━━
- Write in single sentences.
- Use bullet points ONLY for listing multiple conditions or cases, not for the main explanation flow.
- Do NOT use "1. 2. 3." numbered lists.
- Do NOT add a ## Final Answer heading before FINAL_ANSWER:.
- Do NOT repeat calculations. Each step should appear once only.`
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
    system: BASE_SYSTEM,
    prompt: `Rewrite this solution to fully address the critique below. Produce the
final, corrected solution only.

Problem: ${args.statement}
Original solution: ${args.solution}
Critique: ${args.critique}
Required fixes: ${args.fixes.join("; ")}

Follow the same output format as the original:
- Use ## headings for sections.
- Write all math in LaTeX ($inline$ and $$display$$).
- Use bullet lists for listing items.
- End with FINAL_ANSWER: and TAKEAWAY: lines.`
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