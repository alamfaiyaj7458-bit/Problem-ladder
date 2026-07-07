"use client";

/**
 * MathContent — single source of truth for rendering Markdown + LaTeX.
 *
 * Used by: problem statements, solutions, hints, theory, editorials.
 * Pipeline: Markdown + LaTeX → react-markdown + remark-math/gfm → rehype-katex → HTML
 */

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import katex from "katex";
import type { Components } from "react-markdown";
import { plainMathToLatex } from "@/lib/plainMathToLatex";

// ─── Shared component map ─────────────────────────────────────────────────────
// Used by both inline (compact) and block (full) modes.

function sharedComponents(compact: boolean): Components {
  return {
    p: ({ children }) => (
      <p className={compact
        ? "my-1.5 text-base leading-[1.85] text-ink"
        : "my-3 text-base leading-[1.85] text-ink first:mt-0 last:mb-0"
      }>
        {children}
      </p>
    ),

    ul: ({ children }) => (
      <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-ink-faint">
        {children}
      </ul>
    ),

    ol: ({ children }) => (
      <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-ink-faint">
        {children}
      </ol>
    ),

    li: ({ children }) => (
      <li className="text-base leading-relaxed text-ink pl-1">{children}</li>
    ),

    strong: ({ children }) => (
      <strong className="font-semibold text-ink">{children}</strong>
    ),

    em: ({ children }) => (
      <em className="italic text-ink-soft">{children}</em>
    ),

    blockquote: ({ children }) => (
      <div className="my-4 flex gap-3 rounded-r-lg border-l-4 border-accent/40 bg-accent/[0.03] px-4 py-3">
        <div className="text-sm leading-relaxed text-ink-soft italic">{children}</div>
      </div>
    ),

    hr: () => (
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <div className="h-1 w-1 rounded-full bg-ink-faint" />
        <div className="h-px flex-1 bg-line" />
      </div>
    ),

    table: ({ children }) => (
      <div className="my-5 overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm text-ink">{children}</table>
      </div>
    ),

    thead: ({ children }) => (
      <thead className="bg-ink/[0.03] border-b border-line">{children}</thead>
    ),

    tbody: ({ children }) => (
      <tbody className="divide-y divide-line">{children}</tbody>
    ),

    tr: ({ children }) => <tr>{children}</tr>,

    th: ({ children }) => (
      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {children}
      </th>
    ),

    td: ({ children }) => (
      <td className="px-4 py-2.5 text-sm text-ink">{children}</td>
    ),

    code: ({ children, className }) => {
      const lang = className?.replace("language-", "");
      const text = typeof children === "string" ? children : String(children);

      if (lang || text.includes("\n")) {
        return (
          <div className="my-4 overflow-hidden rounded-lg border border-line">
            {lang && (
              <div className="border-b border-line bg-ink/[0.03] px-4 py-1.5">
                <span className="font-mono text-xs text-ink-faint">{lang}</span>
              </div>
            )}
            <pre className="overflow-x-auto bg-ink/[0.02] px-4 py-4 font-mono text-xs leading-relaxed text-ink-soft whitespace-pre">
              <code>{children}</code>
            </pre>
          </div>
        );
      }

      // Short, single-line backtick spans are always someone's informal way
      // of marking up math here (this app has no real use case for literal
      // source code in a problem statement) — render through KaTeX instead
      // of leaving it as a plain monospace blob. Only fall back to plain
      // code styling if KaTeX itself can't make sense of it.
      try {
        const html = katex.renderToString(plainMathToLatex(text), {
          throwOnError: false,
          displayMode: false
        });
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        // fall through to plain code styling below
      }

      return (
        <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-xs text-ink">
          {children}
        </code>
      );
    },

    pre: ({ children }) => <>{children}</>,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MathContentProps {
  /** The Markdown + LaTeX content to render */
  children: string;
  /**
   * compact: single paragraph, minimal margins — for problem statements,
   *          hints, inline snippets.
   * block: full spacing — for solutions, editorials, theory.
   * Defaults to "block".
   */
  mode?: "compact" | "block";
  className?: string;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function MathContent({ children, mode = "block", className }: MathContentProps) {
  return (
    <div className={`math-content ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={sharedComponents(mode === "compact")}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}