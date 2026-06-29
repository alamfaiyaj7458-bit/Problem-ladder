"use client";

import { useState, useTransition, useMemo } from "react";
import { Search, X } from "lucide-react";
import { bulkPublish } from "@/server-actions/publishing";
import { cn } from "@/lib/utils";

interface Problem {
  id: string;
  title: string;
  status: string;
  hasSolution: boolean;
}

export function BulkActionsBar({ problems }: { problems: Problem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<{ done: number; total: number } | null>(null);
  const [publishing, startPublish] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Client-side search filter
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return problems;
    return problems.filter((p) => p.title.toLowerCase().includes(q));
  }, [searchQuery, problems]);

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBulkGenerate() {
    if (selected.size === 0) return;
    const ids = [...selected];
    setGenerating(true);
    setMessage(null);
    setGenProgress({ done: 0, total: ids.length });

    try {
      const res = await fetch("/api/ai/bulk-generate-solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemIds: ids })
      });
      const data = await res.json();
      const failed = (data.results as { ok: boolean }[]).filter((r) => !r.ok).length;
      setMessage({
        text: failed === 0
          ? `Solutions generated for all ${ids.length} problems.`
          : `Done — ${ids.length - failed} succeeded, ${failed} failed.`,
        ok: failed === 0
      });
      setGenProgress({ done: ids.length, total: ids.length });
    } catch {
      setMessage({ text: "Generation failed — check the console.", ok: false });
    } finally {
      setGenerating(false);
      setGenProgress(null);
    }
  }

  function handleBulkPublish() {
    if (selected.size === 0) return;
    setMessage(null);
    startPublish(async () => {
      try {
        const result = await bulkPublish([...selected]);
        setMessage({
          text: `Published ${result.published} problem${result.published !== 1 ? "s" : ""}${result.skipped > 0 ? ` (${result.skipped} skipped — no solution)` : ""}.`,
          ok: true
        });
        setSelected(new Set());
      } catch (e) {
        setMessage({ text: (e as Error).message, ok: false });
      }
    });
  }

  const anySelected = selected.size > 0;
  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div>
      {/* Search input */}
      <div className="mb-3 flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 focus-within:border-accent/50 transition-colors">
        <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search problems…"
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="text-ink-faint hover:text-ink-soft transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Bulk action toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-ink/30 accent-accent"
          />
          {allSelected ? "Deselect all" : `Select all (${filtered.length})`}
        </label>

        {anySelected && (
          <span className="text-sm text-ink-faint">{selected.size} selected</span>
        )}

        {searchQuery && (
          <span className="text-sm text-ink-faint">
            {filtered.length} of {problems.length} shown
          </span>
        )}

        <div className="ml-auto flex gap-2">
          <button
            onClick={handleBulkGenerate}
            disabled={!anySelected || generating || publishing}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              anySelected && !generating && !publishing
                ? "bg-accent text-white hover:bg-accent/90"
                : "bg-ink/10 text-ink-faint cursor-not-allowed"
            )}
          >
            {generating
              ? genProgress
                ? `Generating (${genProgress.done}/${genProgress.total})…`
                : "Generating…"
              : "Generate solutions"}
          </button>

          <button
            onClick={handleBulkPublish}
            disabled={!anySelected || generating || publishing}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              anySelected && !generating && !publishing
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-ink/10 text-ink-faint cursor-not-allowed"
            )}
          >
            {publishing ? "Publishing…" : "Publish selected"}
          </button>
        </div>
      </div>

      {/* Feedback message */}
      {message && (
        <p className={cn("mb-3 text-sm", message.ok ? "text-green-600" : "text-red-500")}>
          {message.text}
        </p>
      )}

      {/* Problem rows with checkboxes */}
      <div className="divide-y divide-line rounded-lg border border-line overflow-hidden">
        {filtered.map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-ink/[0.02] cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => toggleOne(p.id)}
              className="h-4 w-4 shrink-0 rounded border-ink/30 accent-accent"
            />
            <a
              href={`/admin/problems/${p.id}`}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 text-sm font-medium text-ink hover:text-accent truncate"
            >
              {p.title}
            </a>
            <div className="flex shrink-0 items-center gap-2 text-xs text-ink-faint">
              {p.hasSolution && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 font-medium">
                  Solution ready
                </span>
              )}
              <span className={cn(
                "rounded-full px-2 py-0.5 font-medium capitalize",
                p.status === "published" ? "bg-accent/10 text-accent" :
                p.status === "review" ? "bg-amber-100 text-amber-700" :
                "bg-ink/10 text-ink-soft"
              )}>
                {p.status}
              </span>
            </div>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-3 text-sm text-ink-faint">
            {searchQuery ? `No problems matching "${searchQuery}".` : "No problems match this filter."}
          </p>
        )}
      </div>
    </div>
  );
}