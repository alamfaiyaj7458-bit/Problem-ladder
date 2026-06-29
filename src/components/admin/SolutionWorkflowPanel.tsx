"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSolution } from "@/server-actions/solutions";
import { Button } from "@/components/ui/Button";
import { Textarea, Card } from "@/components/ui/Field";
import type { AiSolutionWorkflowLog, Solution, SolutionSource } from "@/lib/types";

type Stage = "idle" | "generated" | "verified" | "critiqued" | "fixed";

export function SolutionWorkflowPanel({
  problemId,
  title,
  statement,
  existingSolution
}: {
  problemId: string;
  title: string;
  statement: string;
  existingSolution: Solution | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState(existingSolution?.content ?? "");
  const [source, setSource] = useState<SolutionSource>(existingSolution?.source ?? "manual");
  const [log, setLog] = useState<AiSolutionWorkflowLog | null>(existingSolution?.ai_workflow_log ?? null);
  const [stage, setStage] = useState<Stage>("idle");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function call(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }

  async function handleGenerate() {
    setLoading("generate");
    setError(null);
    try {
      const data = await call("/api/ai/generate-solution", { title, statement });
      setContent(data.content);
      setSource("ai_generated");
      setLog({ generated: data.content, verification: { is_correct: true, issues: [] }, critique: null, fixed: null });
      setStage("generated");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function handleVerify() {
    setLoading("verify");
    setError(null);
    try {
      const data = await call("/api/ai/verify-solution", { statement, solution: content });
      setLog((prev) => ({
        generated: prev?.generated ?? content,
        verification: data,
        critique: prev?.critique ?? null,
        fixed: prev?.fixed ?? null
      }));
      setStage("verified");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function handleCritique() {
    if (!log?.verification.issues.length) return;
    setLoading("critique");
    setError(null);
    try {
      const data = await call("/api/ai/critique-solution", {
        statement,
        solution: content,
        issues: log.verification.issues
      });
      setLog((prev) => ({
        generated: prev?.generated ?? content,
        verification: prev?.verification ?? { is_correct: false, issues: [] },
        critique: data,
        fixed: prev?.fixed ?? null
      }));
      setStage("critiqued");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function handleFix() {
    if (!log?.critique) return;
    setLoading("fix");
    setError(null);
    try {
      const data = await call("/api/ai/fix-solution", {
        statement,
        solution: content,
        critique: log.critique.critique,
        fixes: log.critique.suggested_fixes
      });
      setContent(data.content);
      setSource("ai_assisted");
      setLog((prev) => ({
        generated: prev?.generated ?? content,
        verification: prev?.verification ?? { is_correct: false, issues: [] },
        critique: prev?.critique ?? null,
        fixed: data.content
      }));
      setStage("fixed");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function handleSave() {
    setLoading("save");
    setError(null);
    try {
      await saveSolution(problemId, { content, source, workflowLog: log });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink">Solution</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={!!loading} onClick={handleGenerate}>
            {loading === "generate" ? "Generating..." : "1. Generate"}
          </Button>
          <Button size="sm" variant="secondary" disabled={!!loading || !content.trim()} onClick={handleVerify}>
            {loading === "verify" ? "Verifying..." : "2. Verify"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!!loading || !log?.verification.issues.length}
            onClick={handleCritique}
          >
            {loading === "critique" ? "Critiquing..." : "3. Critique"}
          </Button>
          <Button size="sm" variant="secondary" disabled={!!loading || !log?.critique} onClick={handleFix}>
            {loading === "fix" ? "Fixing..." : "4. Fix"}
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-level-master">{error}</p>}

      {stage === "verified" && log && (
        <p className={`mt-3 text-sm ${log.verification.is_correct ? "text-level-beginner" : "text-level-advanced"}`}>
          {log.verification.is_correct
            ? "AI verification found no issues."
            : `AI flagged ${log.verification.issues.length} issue(s): ${log.verification.issues.join("; ")}`}
        </p>
      )}
      {stage === "critiqued" && log?.critique && (
        <div className="mt-3 rounded-md bg-level-advanced-soft p-3 text-sm text-ink">
          <p className="font-medium">Critique</p>
          <p className="mt-1 text-ink-soft">{log.critique.critique}</p>
        </div>
      )}

      <div className="mt-4">
        <Textarea
          rows={8}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (source !== "manual" && e.target.value !== log?.fixed && e.target.value !== log?.generated) {
              setSource("ai_assisted");
            }
          }}
          placeholder="Write the solution manually, or generate one with AI above."
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button disabled={!!loading || !content.trim()} onClick={handleSave}>
          {loading === "save" ? "Saving..." : "Save solution"}
        </Button>
        <span className="font-mono text-xs text-ink-faint">source: {source}</span>
        {saved && <span className="text-sm text-level-beginner">Saved.</span>}
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        The admin always has final control — edit this freely before saving, at any stage.
      </p>
    </Card>
  );
}
