"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select, Input, Label, Card } from "@/components/ui/Field";
import { DIFFICULTY_ORDER, DIFFICULTY_LABEL } from "@/lib/difficulty";
import type { Chapter, Unit, DifficultyLevel } from "@/lib/types";

interface ChapterOption extends Chapter {
  unitName: string;
}

export function AIGenerationForm({ units, chapters }: { units: Unit[]; chapters: ChapterOption[] }) {
  const router = useRouter();
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? "");
  const [level, setLevel] = useState<DifficultyLevel>("intermediate");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, level, count })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(`Generated ${data.generatedCount} of ${count} problems as drafts.`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Chapter</Label>
          <Select value={chapterId} onChange={(e) => setChapterId(e.target.value)} required>
            {chapters.length === 0 && <option value="">No chapters yet</option>}
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.unitName} &gt; {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Difficulty level</Label>
            <Select value={level} onChange={(e) => setLevel(e.target.value as DifficultyLevel)}>
              {DIFFICULTY_ORDER.map((l) => (
                <option key={l} value={l}>
                  {DIFFICULTY_LABEL[l]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Number of problems</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
        </div>

        {error && <p className="text-sm text-level-master">{error}</p>}
        {result && <p className="text-sm text-level-beginner">{result}</p>}

        <Button type="submit" disabled={loading || chapters.length === 0}>
          {loading ? `Generating ${count} problems...` : `Generate ${count} problems`}
        </Button>
        <p className="text-xs text-ink-faint">
          Generated problems land in the review queue as drafts — nothing is published automatically.
        </p>
      </form>
    </Card>
  );
}
