"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  name: string;
  slug: string;
}

interface Unit {
  id: string;
  name: string;
  slug: string;
  chapters: Chapter[];
}

// Highlight matching text within a string
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/15 text-accent rounded-sm px-0.5 font-medium not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function UnitSection({
  unit,
  activeUnitSlug,
  activeChapterSlug,
  onNavigate,
  query,
  forceExpanded,
  visibleChapterIds,
}: {
  unit: Unit;
  activeUnitSlug: string | null;
  activeChapterSlug: string | null;
  onNavigate: () => void;
  query: string;
  forceExpanded: boolean;
  visibleChapterIds: Set<string> | null; // null means show all
}) {
  const isActive = activeUnitSlug === unit.slug;
  const [expanded, setExpanded] = useState(isActive);

  // When a search forces expansion, expand; when cleared, restore default
  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  const chaptersToShow = visibleChapterIds
    ? unit.chapters.filter((ch) => visibleChapterIds.has(ch.id))
    : unit.chapters;

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-ink/5"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-ink-faint transition-transform duration-150",
            (expanded || forceExpanded) && "rotate-90"
          )}
        />
        <span className={cn("font-serif text-base font-medium", isActive ? "text-accent" : "text-ink")}>
          <Highlight text={unit.name} query={query} />
        </span>
      </button>

      {(expanded || forceExpanded) && chaptersToShow.length > 0 && (
        <ul className="ml-8 mt-1 space-y-0.5 border-l border-line pl-3">
          {chaptersToShow.map((ch) => {
            const isChapterActive = isActive && activeChapterSlug === ch.slug;
            return (
              <li key={ch.id}>
                <Link
                  href={`/units/${unit.slug}/${ch.slug}`}
                  onClick={onNavigate}
                  className={cn(
                    "relative block rounded-r py-2 pl-3 pr-2 text-sm transition-colors",
                    isChapterActive
                      ? "font-medium text-accent before:absolute before:inset-y-1.5 before:-left-3 before:w-0.5 before:rounded-full before:bg-accent"
                      : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                  )}
                >
                  <Highlight text={ch.name} query={query} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function NavDrawer({ units }: { units: Unit[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const unitMatch = pathname.match(/^\/units\/([^/]+)/);
  const chapterMatch = pathname.match(/^\/units\/[^/]+\/([^/]+)/);
  const activeUnitSlug = unitMatch?.[1] ?? null;
  const activeChapterSlug = chapterMatch?.[1] ?? null;

  // Autofocus search when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const handleClose = useCallback(() => setOpen(false), []);

  // Compute filtered results — memoised for performance
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null; // null = show everything normally

    const results: {
      unit: Unit;
      matchedChapterIds: Set<string>;
      unitMatches: boolean;
    }[] = [];

    for (const unit of units) {
      const unitMatches = unit.name.toLowerCase().includes(q);
      const matchedChapters = unit.chapters.filter((ch) =>
        ch.name.toLowerCase().includes(q)
      );

      if (unitMatches || matchedChapters.length > 0) {
        results.push({
          unit,
          // If the unit itself matches, show all its chapters; else show only matched ones
          matchedChapterIds: unitMatches
            ? new Set(unit.chapters.map((c) => c.id))
            : new Set(matchedChapters.map((c) => c.id)),
          unitMatches,
        });
      }
    }

    return results;
  }, [query, units]);

  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && filtered !== null && filtered.length === 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="text-ink-soft hover:text-accent transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm" onClick={handleClose} />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 flex-col bg-paper-raised shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="font-serif text-base text-ink">Browse</span>
          <button onClick={handleClose} aria-label="Close navigation" className="text-ink-soft hover:text-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-line px-3 py-3">
          <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 focus-within:border-accent/50 transition-colors">
            <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (query) setQuery("");
                  else handleClose();
                }
              }}
              placeholder="Search units or chapters…"
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-ink-faint hover:text-ink-soft transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Unit list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {noResults ? (
            <div className="px-2 py-6 text-center">
              <p className="text-sm text-ink-soft">No matching results.</p>
              <p className="mt-1 text-xs text-ink-faint">Try a different keyword.</p>
            </div>
          ) : filtered !== null ? (
            // Search mode — only show matched units
            filtered.map(({ unit, matchedChapterIds }) => (
              <UnitSection
                key={unit.id}
                unit={unit}
                activeUnitSlug={activeUnitSlug}
                activeChapterSlug={activeChapterSlug}
                onNavigate={handleClose}
                query={query}
                forceExpanded={true}
                visibleChapterIds={matchedChapterIds}
              />
            ))
          ) : (
            // Normal mode — show all units with standard expand/collapse
            units.map((unit) => (
              <UnitSection
                key={unit.id}
                unit={unit}
                activeUnitSlug={activeUnitSlug}
                activeChapterSlug={activeChapterSlug}
                onNavigate={handleClose}
                query=""
                forceExpanded={false}
                visibleChapterIds={null}
              />
            ))
          )}
        </nav>
      </div>
    </>
  );
}