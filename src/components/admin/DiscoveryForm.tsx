"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select, Input, Label, Card } from "@/components/ui/Field";
import type { Chapter, Unit } from "@/lib/types";

interface ChapterOption extends Chapter {
  unitName: string;
}

export function DiscoveryForm({ chapters }: { chapters: ChapterOption[] }) {
  const router = useRouter();
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? "");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/discover-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: chapter.unit_id, chapterId, count })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Discovery failed");
      setResult(
        data.insertedCount > 0
          ? `Found ${data.insertedCount} candidate${data.insertedCount === 1 ? "" : "s"} — review them below.`
          : data.message ?? "No candidates found."
      );
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
        <div>
          <Label>Number to find</Label>
          <Input type="number" min={1} max={15} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </div>

        {error && <p className="text-sm text-level-master">{error}</p>}
        {result && <p className="text-sm text-level-beginner">{result}</p>}

        <Button type="submit" disabled={loading || chapters.length === 0}>
          {loading ? "Searching the web..." : "Find existing problems"}
        </Button>
        <p className="text-xs text-ink-faint">
          The AI searches the web and only returns problems it found a real source for. Nothing is published
          automatically — every candidate needs your approval below.
        </p>
      </form>
    </Card>
  );
}
