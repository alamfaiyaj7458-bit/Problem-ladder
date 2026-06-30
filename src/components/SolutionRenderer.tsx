"use client";

/**
 * SolutionRenderer
 *
 * Renders AI solution text. Delegates all Markdown + KaTeX rendering
 * to MathContent (single source of truth). Adds solution-specific UI:
 * section headers, answer card, takeaway card.
 */

import React, { type ReactNode } from "react";
import { MathContent } from "@/components/MathContent";

// ─── Pre-processor ────────────────────────────────────────────────────────────

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
    if (/\\begin\{(array|tabular|matrix|pmatrix|bmatrix)/.test(line)) {
      inArray = true;
      continue;
    }
    if (inArray) {
      if (/\\end\{(array|tabular|matrix|pmatrix|bmatrix)/.test(line)) inArray = false;
      continue;
    }

    // Defensive fix: malformed "###(label)" or "##(label)" with no space after
    // the hashes is not valid Markdown — strip the leading hashes so it
    // renders as plain text instead of being silently absorbed into a paragraph.
    line = line.replace(/^#{1,6}(?=\S)/, "");

    body.push(line);
  }

  // Defensive fix: ensure every $$ delimiter sits on its own line with blank
  // lines around it. Without this, consecutive $$ ... $$ blocks placed on
  // adjacent lines merge into a single unreadable paragraph.
  let joined = body.join("\n");
  joined = joined.replace(/\$\$/g, "\n$$\n").replace(/\n{3,}/g, "\n\n");

  return { body: joined, finalAnswer, takeaway };
}

// ─── Section header ───────────────────────────────────────────────────────────

const SECTION_META: Record<string, { icon: string; color: string }> = {
  idea:           { icon: "💡", color: "text-amber-600" },
  observation:    { icon: "🔍", color: "text-blue-600" },
  method:         { icon: "⚙️", color: "text-slate-600" },
  setup:          { icon: "📐", color: "text-slate-600" },
  proof:          { icon: "✏️", color: "text-slate-600" },
  claim:          { icon: "📌", color: "text-slate-600" },
  note:           { icon: "📝", color: "text-slate-500" },
  "key takeaway": { icon: "💡", color: "text-amber-600" },
  "final answer": { icon: "✓",  color: "text-green-700" },
};

function SectionHeader({ text }: { text: string }) {
  const lower = text.toLowerCase().trim();
  const stepMatch = text.match(/^(Step\s+\d+)\s*[:\-·]?\s*(.*)/i);
  const isStep = !!stepMatch;

  let icon: string | null = null;
  let color = "text-accent";

  if (isStep) {
    color = "text-accent";
  } else {
    for (const [key, val] of Object.entries(SECTION_META)) {
      if (lower.startsWith(key)) { icon = val.icon; color = val.color; break; }
    }
  }

  return (
    <div className="mt-10 mb-4 first:mt-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs font-mono uppercase tracking-widest text-ink-faint px-1">
          {isStep ? (stepMatch?.[1] ?? "").toUpperCase() : (icon ? `${icon} ` : "") + text}
        </span>
        <div className="h-px flex-1 bg-line" />
      </div>
      {isStep && stepMatch?.[2] && (
        <h3 className={`font-serif text-base font-semibold ${color}`}>{stepMatch[2]}</h3>
      )}
      {!isStep && (
        <h3 className={`font-serif text-base font-semibold ${color}`}>
          {icon ? `${icon} ` : ""}{text}
        </h3>
      )}
    </div>
  );
}

// ─── Answer card ──────────────────────────────────────────────────────────────

function AnswerCard({ content }: { content: string }) {
  return (
    <div className="mt-10 rounded-xl border-2 border-accent/30 bg-accent/[0.03] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-accent/20 bg-accent/[0.05] px-5 py-2.5">
        <span className="text-sm font-semibold text-accent">Final Answer</span>
      </div>
      <div className="px-5 py-5 solution-answer">
        <MathContent mode="compact" className="font-serif text-xl text-ink">
          {content}
        </MathContent>
      </div>
    </div>
  );
}

// ─── Takeaway card ────────────────────────────────────────────────────────────

function TakeawayCard({ content }: { content: string }) {
  return (
    <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-4">
      <span className="mt-0.5 text-lg leading-none">💡</span>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-700">
          Key Takeaway
        </p>
        <div className="text-sm leading-relaxed text-amber-900">
          <MathContent mode="compact">{content}</MathContent>
        </div>
      </div>
    </div>
  );
}

// ─── Override heading components to use SectionHeader ────────────────────────
// We post-process by replacing h1/h2 with SectionHeader.
// MathContent handles all other elements.

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";

const solutionComponents: Components = {
  h1: ({ children }) => <SectionHeader text={String(children)} />,
  h2: ({ children }) => <SectionHeader text={String(children)} />,
  h3: ({ children }) => (
    <h4 className="mt-6 mb-2 font-serif text-sm font-semibold text-ink">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="my-3 text-base leading-[1.85] text-ink first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-ink-faint">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-ink-faint">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-base leading-relaxed text-ink pl-1">{children}</li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic text-ink-soft">{children}</em>,
  blockquote: ({ children }) => (
    <div className="my-4 flex gap-3 rounded-r-lg border-l-4 border-accent/40 bg-accent/[0.03] px-4 py-3">
      <div className="text-sm leading-relaxed text-ink-soft italic">{children}</div>
    </div>
  ),
  hr: () => (
    <div className="my-8 flex items-center gap-3">
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
  thead: ({ children }) => <thead className="bg-ink/[0.03] border-b border-line">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-line">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">{children}</th>
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
    return <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-xs text-ink">{children}</code>;
  },
  pre: ({ children }) => <>{children}</>,
};

// ─── Root export ──────────────────────────────────────────────────────────────

export function SolutionRenderer({ content }: { content: string }) {
  const { body, finalAnswer, takeaway } = preprocess(content);

  return (
    <div className="solution-body">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={solutionComponents}
      >
        {body}
      </ReactMarkdown>

      {finalAnswer && <AnswerCard content={finalAnswer} />}
      {takeaway && <TakeawayCard content={takeaway} />}
    </div>
  );
}