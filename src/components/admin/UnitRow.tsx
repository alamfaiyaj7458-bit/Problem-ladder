"use client";

import { useState } from "react";
import Link from "next/link";
import { updateUnit, deleteUnit } from "@/server-actions/units";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Field";
import type { Unit } from "@/lib/types";

export function UnitRow({ unit, chapterCount }: { unit: Unit; chapterCount: number }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateUnit(unit.id, formData);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${unit.name}" and all its chapters and problems?`)) return;
    await deleteUnit(unit.id);
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-3 px-4 py-4">
        <div>
          <Label>Name</Label>
          <Input name="name" defaultValue={unit.name} required />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea name="description" defaultValue={unit.description ?? ""} rows={2} />
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
      <div className="min-w-0">
        <p className="font-medium text-ink">{unit.name}</p>
        <p className="text-xs text-ink-faint">{chapterCount} chapters · /{unit.slug}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link href={`/admin/units/${unit.id}`}>
          <Button variant="secondary" size="sm">
            Chapters
          </Button>
        </Link>
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