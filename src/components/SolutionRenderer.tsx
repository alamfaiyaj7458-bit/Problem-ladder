"use client";

/**
 * SolutionRenderer
 *
 * Renders flowing prose + display equations produced by the solution prompt.
 * The AI no longer uses ## headings — solutions read as continuous derivations.
 * This renderer is tuned for that format: generous line height, centered
 * equations with breathing room, a prominent answer card, a quiet takeaway.
 */

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";
import { MathContent } from "@/components/MathContent";

// ─── Pre-processor ─────────────────────────────────────────────────────────────

function preprocess(raw: string): {
  body: string;
  finalAnswer: string | null;
  takeaway: string | null;
} {
  const lines = raw.split("\n");
  const body: string[] = [];
  let finalAnswer: string | null = null;
  let takeaway: string | null = null;
  let inArray = false;

  for (let line of lines) {
    if (/^FINAL_ANSWER:\s*/i.test(line)) {
      finalAnswer = line.replace(/^FINAL_ANSWER:\s*/i, "").trim();
      continue;
    }
    if (/^TAKEAWAY:\s*/i.test(line)) {
      takeaway = line.replace(/^TAKEAWAY:\s*/i, "").trim();
      continue;
    }
    // Strip LaTeX array environments that don't render
    if (/\\begin\{(array|tabular|matrix|pmatrix|bmatrix)/.test(line)) {
      inArray = true; continue;
    }
    if (inArray) {
      if (/\\end\{(array|tabular|matrix|pmatrix|bmatrix)/.test(line)) inArray = false;
      continue;
    }
    // Strip malformed hash patterns like "###(label)" — no space after #
    line = line.replace(/^#{1,6}(?=\S)/, "");
    body.push(line);
  }

  // Ensure every $$ block is properly delimited on its own line with
  // blank lines around it. Track open/close state to avoid the JS
  // replacement-string "$$" footgun (which collapses $$ to a single $).
  const normalized: string[] = [];
  let mathOpen = false;

  for (const line of body) {
    const trimmed = line.trim();

    if (trimmed === "$$") {
      normalized.push("", "$$", "");
      mathOpen = !mathOpen;
      continue;
    }
    if (!mathOpen && trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
      normalized.push("", trimmed, "");
      continue;
    }
    if (!mathOpen && trimmed.startsWith("$$")) {
      normalized.push("", "$$", trimmed.slice(2).trim());
      mathOpen = true;
      continue;
    }
    if (mathOpen && trimmed.endsWith("$$")) {
      normalized.push(trimmed.slice(0, -2).trim(), "$$", "");
      mathOpen = false;
      continue;
    }
    normalized.push(line);
  }

  const joined = normalized.join("\n").replace(/\n{3,}/g, "\n\n");
  return { body: joined, finalAnswer, takeaway };
}

// ─── Component map ─────────────────────────────────────────────────────────────
// Tuned for flowing derivation text — no section headers needed.

const components: Components = {
  // If the AI still produces a heading (older stored solutions), render it
  // cleanly but without the heavy SectionHeader treatment.
  h1: ({ children }) => (
    <p className="mt-8 mb-2 font-serif text-base font-semibold text-ink-soft">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="mt-8 mb-2 font-serif text-base font-semibold text-ink-soft">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="mt-5 mb-1 font-serif text-sm font-semibold text-ink-soft">{children}</p>
  ),

  // Prose paragraphs — comfortable reading size, generous leading
  p: ({ children }) => (
    <p className="my-4 text-[1.05rem] leading-[1.9] text-ink">{children}</p>
  ),

  ul: ({ children }) => (
    <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-ink-faint">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-ink-faint">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[1.05rem] leading-relaxed text-ink pl-1">{children}</li>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-ink-soft">{children}</em>
  ),

  hr: () => (
    <div className="my-8 border-t border-line" />
  ),

  blockquote: ({ children }) => (
    <div className="my-4 border-l-2 border-ink/20 pl-4 text-[1.05rem] italic text-ink-soft">
      {children}
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
  tbody: ({ children }) => <tbody className="divide-y divide-line">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-2.5 text-sm text-ink">{children}</td>,

  code: ({ children, className }) => {
    const lang = className?.replace("language-", "");
    if (lang || (typeof children === "string" && String(children).includes("\n"))) {
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
    return (
      <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-xs text-ink">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
};

// ─── Answer card ───────────────────────────────────────────────────────────────

function AnswerCard({ content }: { content: string }) {
  return (
    <div className="mt-10 rounded-xl border border-accent/30 bg-accent/[0.03] overflow-hidden">
      <div className="border-b border-accent/20 bg-accent/[0.04] px-5 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent">
          Answer
        </span>
      </div>
      <div className="px-6 py-5 solution-answer">
        <MathContent mode="compact" className="font-serif text-xl text-ink">
          {content}
        </MathContent>
      </div>
    </div>
  );
}

// ─── Takeaway ──────────────────────────────────────────────────────────────────

function TakeawayBlock({ content }: { content: string }) {
  return (
    <div className="mt-4 rounded-lg border border-line bg-paper px-5 py-4">
      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        Key insight
      </p>
      <div className="text-sm italic leading-relaxed text-ink-soft">
        <MathContent mode="compact">{content}</MathContent>
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export function SolutionRenderer({ content }: { content: string }) {
  const { body, finalAnswer, takeaway } = preprocess(content);

  return (
    <div className="solution-body">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {body}
      </ReactMarkdown>

      {finalAnswer && <AnswerCard content={finalAnswer} />}
      {takeaway && <TakeawayBlock content={takeaway} />}
    </div>
  );
}