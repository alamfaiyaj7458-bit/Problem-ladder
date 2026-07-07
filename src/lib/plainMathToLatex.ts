/**
 * plainMathToLatex — best-effort conversion of informally-typed math into
 * LaTeX for KaTeX rendering.
 *
 * Context: problem statements are written in Markdown, and it's natural for
 * an admin (or the AI) to wrap a math snippet in backticks — that's the
 * "format this specially" gesture in Markdown. But backtick spans are plain
 * code by default, so `f(x) = { ... }` was rendering as a gray monospace
 * blob instead of real math. This converts the common plain-text math
 * patterns people actually type (^, !=, <=, >=, sqrt(), and piecewise
 * "{ expr if cond, expr if cond }" notation) into LaTeX so those spans can
 * be rendered through KaTeX instead.
 *
 * This is intentionally a light heuristic converter, not a full parser —
 * it handles the common cases well and otherwise degrades to passing the
 * text through mostly unchanged (KaTeX already understands bare `^` and
 * most operators natively).
 */

/** Splits on a delimiter, but only at paren-depth 0 (won't split inside "(...)"). */
function splitTopLevel(input: string, delimiter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of input) {
    if (ch === "(" || ch === "{" || ch === "[") depth += 1;
    if (ch === ")" || ch === "}" || ch === "]") depth -= 1;
    if (ch === delimiter && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

/**
 * Converts a "{ expr if cond, expr if cond, ... }" piecewise block into
 * \begin{cases} expr & cond \\ ... \end{cases}. Returns null if the text
 * doesn't contain a recognizable piecewise block (so the caller can fall
 * back to leaving it alone).
 */
function convertPiecewise(text: string): string | null {
  const braceMatch = text.match(/\{([^{}]+)\}/);
  if (!braceMatch || braceMatch.index === undefined) return null;

  const inner = braceMatch[1];
  if (inner === undefined) return null;
  const segments = splitTopLevel(inner, ",").map((s) => s.trim()).filter(Boolean);
  if (segments.length < 2) return null; // not worth treating as piecewise

  const rows = segments.map((segment) => {
    const ifMatch = segment.match(/^(.*?)\bif\b(.*)$/i);
    if (ifMatch && ifMatch[1] !== undefined && ifMatch[2] !== undefined) {
      return `${ifMatch[1].trim()} & ${ifMatch[2].trim()}`;
    }
    return `${segment} &`;
  });

  const cases = `\\begin{cases} ${rows.join(" \\\\ ")} \\end{cases}`;
  return text.slice(0, braceMatch.index) + cases + text.slice(braceMatch.index + braceMatch[0].length);
}

/** Token-level replacements for operators people type in plain text. */
function replaceOperators(text: string): string {
  return text
    .replace(/!=/g, " \\neq ")
    .replace(/<=/g, " \\leq ")
    .replace(/>=/g, " \\geq ")
    .replace(/\binfinity\b/gi, "\\infty")
    .replace(/(?<![a-zA-Z\\])pi(?![a-zA-Z])/g, "\\pi")
    .replace(/sqrt\(([^()]*)\)/g, "\\sqrt{$1}")
    .replace(/\babs\(([^()]*)\)/g, "\\left|$1\\right|");
}

export function plainMathToLatex(raw: string): string {
  const piecewise = convertPiecewise(raw);
  return replaceOperators(piecewise ?? raw);
}

/**
 * Heuristic: does this short backtick span look like a math expression
 * (as opposed to genuine inline code)? This app is math-problem content
 * only — there's no real use case for literal source code in a problem
 * statement — so this is deliberately permissive.
 */
export function looksLikeMath(text: string): boolean {
  return /[=^{}]|!=|<=|>=|\\[a-zA-Z]/.test(text);
}