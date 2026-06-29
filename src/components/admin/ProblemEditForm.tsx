"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProblem } from "@/server-actions/problems";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Card } from "@/components/ui/Field";
import { DIFFICULTY_LABEL, scoreToLevel } from "@/lib/difficulty";
import type { Problem } from "@/lib/types";

export function ProblemEditForm({ problem }: { problem: Problem }) {
  const router = useRouter();
  const [title, setTitle] = useState(problem.title);
  const [statement, setStatement] = useState(problem.statement);
  const [difficultyScore, setDifficultyScore] = useState(problem.difficulty_score);
  const [tags, setTags] = useState(problem.tags.join(", "));
  const [sourceNotes, setSourceNotes] = useState(problem.source_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const formData = new FormData(e.currentTarget);
      await updateProblem(problem.id, formData);
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label>Statement</Label>
          <Textarea
            name="statement"
            rows={6}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>
            Difficulty score ({difficultyScore}) — {DIFFICULTY_LABEL[scoreToLevel(difficultyScore)]}
          </Label>
          <input
            type="range"
            name="difficulty_score"
            min={0}
            max={100}
            value={difficultyScore}
            onChange={(e) => setDifficultyScore(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <Label>Tags (comma-separated)</Label>
          <Input name="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div>
          <Label>Source notes (admin-only)</Label>
          <Textarea
            name="source_notes"
            rows={2}
            value={sourceNotes}
            onChange={(e) => setSourceNotes(e.target.value)}
            placeholder="Optional — e.g. where this was adapted from, edits made"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {saved && <span className="text-sm text-level-beginner">Saved.</span>}
        </div>
      </form>
    </Card>
  );
}
