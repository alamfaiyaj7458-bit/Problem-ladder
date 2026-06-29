"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { SimilarProblem } from "@/lib/types";

export function DuplicateWarningBanner({
  problemId,
  chapterId,
  title,
  statement
}: {
  problemId: string;
  chapterId: string;
  title: string;
  statement: string;
}) {
  const [matches, setMatches] = useState<SimilarProblem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/ai/check-duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, statement, chapterId, excludeId: problemId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMatches(data.matches ?? []);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-check only when the underlying content changes (e.g. after navigating
    // to a different problem) — not on every keystroke from the edit form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  if (loading || !matches || matches.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-md border border-level-advanced bg-level-advanced-soft p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-level-advanced" />
      <div>
        <p className="text-sm font-medium text-ink">Possible duplicates in this chapter</p>
        <ul className="mt-1.5 space-y-1">
          {matches.map((m) => (
            <li key={m.id} className="text-sm text-ink-soft">
              <Link href={`/admin/problems/${m.id}`} className="text-accent hover:underline">
                {m.title}
              </Link>{" "}
              <span className="font-mono text-xs text-ink-faint">
                ({Math.round(m.similarity * 100)}% similar · {m.status})
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-ink-faint">This is a warning, not a block — review and decide.</p>
      </div>
    </div>
  );
}
