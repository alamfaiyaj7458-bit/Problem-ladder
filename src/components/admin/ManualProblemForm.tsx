"use client";

import { useState } from "react";
import { createProblem } from "@/server-actions/problems";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, Card } from "@/components/ui/Field";
import { McqOptionsEditor } from "@/components/admin/McqOptionsEditor";
import { DIFFICULTY_LABEL, scoreToLevel } from "@/lib/difficulty";
import type { Chapter, Unit } from "@/lib/types";

interface ChapterOption extends Chapter {
  unitName: string;
}

export function ManualProblemForm({ units, chapters }: { units: Unit[]; chapters: ChapterOption[] }) {
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? "");
  const [difficultyScore, setDifficultyScore] = useState(30);
  const [tags, setTags] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [suggestingOptions, setSuggestingOptions] = useState(false);
  const [suggestOptionsError, setSuggestOptionsError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSuggestOptions() {
    if (!title.trim() || !statement.trim()) {
      setSuggestOptionsError("Add a title and statement first.");
      return;
    }
    setSuggestingOptions(true);
    setSuggestOptionsError(null);
    try {
      const res = await fetch("/api/ai/suggest-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, statement })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not suggest options");

      setOptions([0, 1, 2, 3].map((i) => data.options[i] ?? ""));
      setCorrectIndex(data.correct_option);
    } catch (err) {
      setSuggestOptionsError((err as Error).message);
    } finally {
      setSuggestingOptions(false);
    }
  }

  async function handleSuggest() {
    if (!title.trim() || !statement.trim()) {
      setSuggestError("Add a title and statement first.");
      return;
    }
    setSuggesting(true);
    setSuggestError(null);
    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, statement })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not get a suggestion");

      setChapterId(data.chapter_id);
      setDifficultyScore(Math.round(data.difficulty_score));
      setTags(data.tags.join(", "));
    } catch (err) {
      setSuggestError((err as Error).message);
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!chapterId) {
      e.preventDefault();
      alert("Create a chapter first.");
      return;
    }
    setSubmitting(true);
  }

  return (
    <Card className="p-6">
      <form action={createProblem} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label>Statement</Label>
          <Textarea
            name="statement"
            rows={5}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-md bg-ink/[0.03] p-3">
          <Button type="button" variant="secondary" size="sm" onClick={handleSuggest} disabled={suggesting}>
            {suggesting ? "Asking AI..." : "Suggest chapter, difficulty & tags"}
          </Button>
          {suggestError && <p className="text-xs text-level-master">{suggestError}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Chapter</Label>
            <Select name="chapter_id" value={chapterId} onChange={(e) => setChapterId(e.target.value)} required>
              {chapters.length === 0 && <option value="">No chapters yet</option>}
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.unitName} &gt; {c.name}
                </option>
              ))}
            </Select>
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
        </div>

        <div>
          <Label>Tags (comma-separated)</Label>
          <Input name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="circle, tangent" />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={handleSuggestOptions} disabled={suggestingOptions}>
              {suggestingOptions ? "Solving & writing choices..." : "Suggest answer choices"}
            </Button>
            {suggestOptionsError && <p className="text-xs text-level-master">{suggestOptionsError}</p>}
          </div>
          <McqOptionsEditor
            options={options}
            correctIndex={correctIndex}
            onChange={setOptions}
            onCorrectIndexChange={setCorrectIndex}
          />
        </div>

        <Button type="submit" disabled={submitting || chapters.length === 0}>
          Create draft problem
        </Button>
      </form>
    </Card>
  );
}