"use client";

import { useState } from "react";
import { deleteProblem } from "@/server-actions/problems";
import { Button } from "@/components/ui/Button";

export function DeleteProblemButton({ problemId, title }: { problemId: string; title: string }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    await deleteProblem(problemId);
  }

  return (
    <Button variant="danger" size="sm" disabled={busy} onClick={handleDelete}>
      {busy ? "Deleting..." : "Delete problem"}
    </Button>
  );
}
