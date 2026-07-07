"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, Lightbulb, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { submitVerifiedAnswer, unsubmitAnswer } from "@/server-actions/submissions";
import { MathContent } from "@/components/MathContent";
import { SolutionRenderer } from "@/components/SolutionRenderer";

interface Props {
  content: string | null;
  options: string[];
  correctOption: number | null;
  problemId: string;
  problemTitle: string;
  problemStatement: string;
  isSignedIn: boolean;
  alreadySolved: boolean;
  nextProblemId?: string | null;
  prevProblemId?: string | null;
}

type VerifyState = "idle" | "verifying" | "correct" | "incorrect";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function SolutionReveal({
  content,
  options,
  correctOption,
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

  // Answer selection — a single chosen option index, like ExamSIDE's MCQs.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [verifyState, setVerifyState] = useState<VerifyState>(alreadySolved ? "correct" : "idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Hint
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  // Solution reveal
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [revealConfirm, setRevealConfirm] = useState(false);

  const hasOptions = options.length >= 2 && correctOption !== null;

  // ── Submit answer ────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIndex === null) return;
    if (!isSignedIn) {
      window.location.href = `/login?next=/problems/${problemId}`;
      return;
    }

    setVerifyState("verifying");
    setFeedback(null);

    try {
      if (!hasOptions) {
        // Misconfigured problem (shouldn't happen for published ones, but
        // don't silently claim correctness if it does).
        setAttempts((n) => n + 1);
        setVerifyState("incorrect");
        setFeedback("This question doesn't have answer choices configured yet. Your attempt has been recorded.");
        await submitVerifiedAnswer(problemId, options[selectedIndex] ?? String(selectedIndex), false);
        return;
      }

      const isCorrect = selectedIndex === correctOption;
      setAttempts((n) => n + 1);
      setVerifyState(isCorrect ? "correct" : "incorrect");
      setFeedback(isCorrect ? "Correct!" : "Wrong!");

      await submitVerifiedAnswer(problemId, options[selectedIndex] ?? String(selectedIndex), isCorrect);
      if (isCorrect) {
        setSolved(true);
        setSolutionOpen(true);
      }
    } catch (err) {
      setVerifyState("idle");
      setFeedback("Something went wrong recording your answer. Please try again.");
      console.error(err);
    }
  }

  // ── Undo ─────────────────────────────────────────────────────────────────────

  async function handleUndo() {
    setUndoing(true);
    try {
      await unsubmitAnswer(problemId);
      setSolved(false);
      setVerifyState("idle");
      setSelectedIndex(null);
      setFeedback(null);
      setAttempts(0);
      setSolutionOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setUndoing(false);
    }
  }

  // ── Hint ─────────────────────────────────────────────────────────────────────

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

  // ── Reveal solution (after failed attempts) ───────────────────────────────

  function handleRevealRequest() {
    if (verifyState === "correct") {
      setSolutionOpen(true);
      return;
    }
    setRevealConfirm(true);
  }

  function handleRevealConfirm() {
    setRevealConfirm(false);
    setSolutionOpen(true);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const locked = verifyState === "correct" || verifyState === "verifying";
  const showAnswerState = verifyState === "correct" || verifyState === "incorrect";
  const canSubmit = selectedIndex !== null && verifyState !== "verifying" && verifyState !== "correct";
  const showSolutionButton = content && (verifyState === "correct" || attempts > 0);

  const PrevNext = (prevProblemId || nextProblemId) && (
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
  );

  return (
    <div className="space-y-5">

      {/* ── Answer choices ───────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-faint">
            Your answer
          </label>

          {!hasOptions ? (
            <p className="text-sm text-ink-faint">This question doesn't have answer choices yet.</p>
          ) : (
            <div className="space-y-2">
              {options.map((option, i) => {
                const isSelected = selectedIndex === i;
                const isCorrectOption = i === correctOption;

                // Once an attempt has been made, reveal correct/incorrect
                // styling (ExamSIDE-style review), otherwise just show
                // the plain selectable state.
                const state = !showAnswerState
                  ? (isSelected ? "selected" : "default")
                  : isCorrectOption
                    ? "correct"
                    : isSelected
                      ? "incorrect"
                      : "muted";

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={locked}
                    onClick={() => setSelectedIndex(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                      state === "default" && "border-line bg-white text-ink hover:border-accent hover:bg-accent/[0.03]",
                      state === "selected" && "border-accent bg-accent/[0.06] text-ink",
                      state === "correct" && "border-green-300 bg-green-50 text-green-900",
                      state === "incorrect" && "border-red-300 bg-red-50 text-red-900",
                      state === "muted" && "border-line bg-white text-ink-faint",
                      locked && "cursor-default"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 flex-none items-center justify-center rounded-full border text-xs font-semibold",
                        state === "default" && "border-line text-ink-soft",
                        state === "selected" && "border-accent bg-accent text-white",
                        state === "correct" && "border-green-400 bg-green-500 text-white",
                        state === "incorrect" && "border-red-400 bg-red-500 text-white",
                        state === "muted" && "border-line text-ink-faint"
                      )}
                    >
                      {state === "correct" ? <Check className="h-3.5 w-3.5" /> : state === "incorrect" ? <XCircle className="h-3.5 w-3.5" /> : LETTERS[i]}
                    </span>
                    <span className="flex-1">
                      <MathContent mode="compact">{option}</MathContent>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback message */}
        {feedback && verifyState === "incorrect" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{feedback}</p>
          </div>
        )}
        {feedback && verifyState === "correct" && (
          <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <p className="text-sm font-semibold text-green-800">{feedback}</p>
          </div>
        )}

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-3">
          {verifyState !== "correct" && (
            <Button
              type="submit"
              disabled={!canSubmit}
              className={cn("min-w-[140px]", !isSignedIn && "opacity-70")}
            >
              {verifyState === "verifying" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : attempts > 0 ? (
                "Try again"
              ) : (
                "Submit answer"
              )}
            </Button>
          )}

          {verifyState === "correct" && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoing}
              className="text-xs text-ink-faint hover:text-ink-soft underline underline-offset-2 transition-colors"
            >
              {undoing ? "Undoing…" : "Undo"}
            </button>
          )}

          {!isSignedIn && (
            <span className="text-xs text-ink-faint">
              <a href={`/login?next=/problems/${problemId}`} className="text-accent hover:underline">
                Sign in
              </a>{" "}
              to track progress
            </span>
          )}

          {PrevNext}
        </div>
      </form>

      {/* ── Hint ─────────────────────────────────────────────────────────── */}
      {verifyState !== "correct" && (
        <>
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
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm space-y-1">
              <p className="flex items-center gap-1.5 font-medium text-amber-700">
                <Lightbulb className="h-4 w-4" />
                Hint
              </p>
              <MathContent mode="compact">{hint}</MathContent>
            </div>
          )}
          {hintError && <p className="text-xs text-red-500">{hintError}</p>}
        </>
      )}

      {/* ── Solution ─────────────────────────────────────────────────────── */}
      {content && (
        <div>
          {/* Reveal confirmation dialog for incorrect attempts */}
          {revealConfirm && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <p className="font-medium text-amber-800">Reveal the solution?</p>
              <p className="mt-0.5 text-amber-700">
                This will mark the problem as attempted but not solved.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleRevealConfirm}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
                >
                  Yes, show solution
                </button>
                <button
                  onClick={() => setRevealConfirm(false)}
                  className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  Keep trying
                </button>
              </div>
            </div>
          )}

          {/* Show solution button — only after an attempt or when correct */}
          {showSolutionButton && !revealConfirm && (
            <Button
              variant="secondary"
              onClick={solutionOpen
                ? () => setSolutionOpen(false)
                : verifyState === "correct"
                  ? () => setSolutionOpen(true)
                  : handleRevealRequest}
              aria-expanded={solutionOpen}
            >
              {solutionOpen ? "Hide solution" : "See solution"}
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", solutionOpen && "rotate-180")} />
            </Button>
          )}

          {/* Solution content */}
          {solutionOpen && (
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-line bg-ink/[0.02] px-6 py-3">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Solution
                </span>
                <button
                  onClick={() => setSolutionOpen(false)}
                  className="text-xs text-ink-faint hover:text-ink-soft transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="px-8 py-7">
                <SolutionRenderer content={content} />
              </div>
            </div>
          )}

          {/* First-time gate message — before any attempt */}
          {!showSolutionButton && !revealConfirm && (
            <p className="text-xs text-ink-faint">
              Submit your answer to unlock the solution, or{" "}
              <button
                onClick={() => setRevealConfirm(true)}
                className="underline underline-offset-2 hover:text-ink-soft transition-colors"
              >
                reveal it now
              </button>
              .
            </p>
          )}
        </div>
      )}

      {!content && (
        <p className="text-sm text-ink-faint">A solution for this problem is on its way.</p>
      )}
    </div>
  );
}