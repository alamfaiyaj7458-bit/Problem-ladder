"use client";

import { useEffect, useState } from "react";
import { ProblemCard } from "@/components/ProblemCard";
import type { DifficultyLevel } from "@/lib/types";

interface Problem {
  id: string;
  title: string;
  difficulty_level: DifficultyLevel;
  difficulty_score: number;
  tags: string[] | null;
}

export function ProblemList({
  problems,
  chapterId,
}: {
  problems: Problem[];
  chapterId: string;
}) {
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/solved?chapter=${chapterId}`)
      .then((r) => r.json())
      .then((ids: string[]) => setSolvedIds(new Set(ids)))
      .catch(() => {}); // degrade gracefully — cards just show as unsolved
  }, [chapterId]);

  return (
    <div className="grid gap-3">
      {problems.map((p) => (
        <ProblemCard
          key={p.id}
          id={p.id}
          title={p.title}
          level={p.difficulty_level}
          score={p.difficulty_score}
          tags={p.tags ?? []}
          solved={solvedIds.has(p.id)}
        />
      ))}
    </div>
  );
}