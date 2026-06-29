"use client";

import { useState } from "react";
import { updateChapter, deleteChapter } from "@/server-actions/chapters";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Field";
import type { Chapter } from "@/lib/types";

export function ChapterRow({ chapter, problemCount }: { chapter: Chapter; problemCount: number }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateChapter(chapter.id, chapter.unit_id, formData);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${chapter.name}" and all its problems?`)) return;
    await deleteChapter(chapter.id, chapter.unit_id);
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-3 px-4 py-4">
        <div>
          <Label>Name</Label>
          <Input name="name" defaultValue={chapter.name} required />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea name="description" defaultValue={chapter.description ?? ""} rows={2} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="font-medium text-ink">{chapter.name}</p>
        <p className="text-xs text-ink-faint">{problemCount} problems · /{chapter.slug}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
