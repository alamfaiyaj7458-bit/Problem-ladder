"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitForReview, revertToDraft, publishProblem, unpublishProblem } from "@/server-actions/publishing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Field";
import { STATUS_LABEL, STATUS_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ProblemStatus } from "@/lib/types";

export function PublishControls({ problemId, status }: { problemId: string; status: ProblemStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-soft">Status</p>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_COLOR[status])}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {error && <p className="mt-2 text-sm text-level-master">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {status === "draft" && (
          <Button size="sm" disabled={busy} onClick={() => run(() => submitForReview(problemId))}>
            Submit for review
          </Button>
        )}
        {status === "review" && (
          <>
            <Button size="sm" disabled={busy} onClick={() => run(() => publishProblem(problemId))}>
              Publish
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => run(() => revertToDraft(problemId))}
            >
              Send back to draft
            </Button>
          </>
        )}
        {status === "published" && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => unpublishProblem(problemId))}>
            Unpublish (back to review)
          </Button>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Publishing requires a solution to already be written or generated below.
      </p>
    </Card>
  );
}
