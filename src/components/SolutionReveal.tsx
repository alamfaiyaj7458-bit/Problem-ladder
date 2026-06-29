"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { submitAnswer, unsubmitAnswer } from "@/server-actions/submissions";
import { MathContent } from "@/components/MathContent";
import { SolutionRenderer } from "@/components/SolutionRenderer";

interface Props {
  content: string | null;
  problemId: string;
  problemTitle: string;
  problemStatement: string;
  isSignedIn: boolean;
  alreadySolved: boolean;
  nextProblemId?: string | null;
  prevProblemId?: string | null;
}

export function SolutionReveal({
  content,
  problemId,
  problemTitle,
  problemStatement,
  isSignedIn,
  alreadySolved,
  nextProblemId,
  prevProblemId
}: Props) {
  const [solved, setSolved] = useState(alreadySolved);
  const [undoing, setUndoing] = useState(false);

  // Hint state
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  // Solution gate: user must attempt or explicitly skip before seeing solution
  const [attempted, setAttempted] = useState(alreadySolved);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleMarkSolved() {
    if (!isSignedIn) {
      window.location.href = `/login?next=/problems/${problemId}`;
      return;
    }
    setSubmitting(true);
    try {
      await submitAnswer(problemId, "");
      setSolved(true);
      setAttempted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUndo() {
    setUndoing(true);
    try {
      await unsubmitAnswer(problemId);
      setSolved(false);
    } catch (e) {
      console.error(e);
    } finally {
      setUndoing(false);
    }
  }

  async function handleGetHint() {
    if (!isSignedIn) {
      window.location.href = `/login?next=/problems/${problemId}`;
      return;
    }
    setHintLoading(true);
    setHintError(null);
    try {
      const res = await fetch("/api/ai/generate-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: problemTitle, statement: problemStatement })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get hint");
      setHint(data.hint);
    } catch (e) {
      setHintError((e as Error).message);
    } finally {
      setHintLoading(false);
    }
  }

  return (
    <div className="space-y-4">

      {/* Row: Mark as solved / Solved + Undo — Prev/Next far right */}
      <div className="flex items-center gap-3">
        {solved ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Solved!
            </div>
            <button
              onClick={handleUndo}
              disabled={undoing}
              className="text-xs text-ink-faint hover:text-ink-soft underline underline-offset-2 transition-colors"
            >
              {undoing ? "Undoing…" : "Undo"}
            </button>
          </div>
        ) : (
          <Button variant="primary" onClick={handleMarkSolved} disabled={submitting}>
            {submitting ? "Saving..." : isSignedIn ? "Mark as solved" : "Sign in to track progress"}
          </Button>
        )}

        {(prevProblemId || nextProblemId) && (
          <div className="ml-auto flex items-center gap-1">
            <a
              href={prevProblemId ? `/problems/${prevProblemId}` : undefined}
              aria-disabled={!prevProblemId}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2.5 py-2 text-sm font-medium transition-colors",
                prevProblemId
                  ? "border-line bg-paper-raised text-ink-soft hover:text-accent hover:border-accent"
                  : "border-line/50 bg-paper-raised text-ink-faint cursor-not-allowed pointer-events-none"
              )}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Prev
            </a>
            <a
              href={nextProblemId ? `/problems/${nextProblemId}` : undefined}
              aria-disabled={!nextProblemId}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2.5 py-2 text-sm font-medium transition-colors",
                nextProblemId
                  ? "border-line bg-paper-raised text-ink-soft hover:text-accent hover:border-accent"
                  : "border-line/50 bg-paper-raised text-ink-faint cursor-not-allowed pointer-events-none"
              )}
            >
              Next
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* Hint */}
      {!hint ? (
        <button
          onClick={handleGetHint}
          disabled={hintLoading}
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
        >
          <Lightbulb className="h-4 w-4" />
          {hintLoading ? "Getting hint…" : "Get a hint"}
        </button>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-ink space-y-1">
          <p className="flex items-center gap-1.5 font-medium text-amber-700">
            <Lightbulb className="h-4 w-4" />
            Hint
          </p>
          <MathContent mode="compact">{hint}</MathContent>
        </div>
      )}
      {hintError && <p className="text-xs text-red-500">{hintError}</p>}

      {/* Solution — gated until user marks solved or explicitly skips */}
      {content ? (
        <div>
          {!attempted ? (
            <div className="space-y-2">
              <Button
                variant="secondary"
                onClick={() => { setAttempted(true); setSolutionOpen(true); }}
              >
                <ChevronDown className="h-4 w-4" />
                See solution
              </Button>
              <p className="text-xs text-ink-faint">
                Try solving it first, or{" "}
                <button
                  onClick={() => { setAttempted(true); setSolutionOpen(true); }}
                  className="underline underline-offset-2 hover:text-ink-soft transition-colors"
                >
                  skip straight to the solution
                </button>
              </p>
            </div>
          ) : (
            <div>
              <Button variant="secondary" onClick={() => setSolutionOpen((v) => !v)} aria-expanded={solutionOpen}>
                {solutionOpen ? "Hide solution" : "See solution"}
                <ChevronDown className={cn("h-4 w-4 transition-transform", solutionOpen && "rotate-180")} />
              </Button>
              {solutionOpen && (
                <div className="mt-4 rounded-lg border border-line bg-paper-raised p-5 text-sm">
                  <SolutionRenderer content={content} />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-faint">A solution for this problem is on its way.</p>
      )}
    </div>
  );
}