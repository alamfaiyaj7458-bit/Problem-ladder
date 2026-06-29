"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChapterData {
  id: string;
  name: string;
  slug: string;
  unitName: string;
  unitSlug: string;
}

interface UnitData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ProblemData {
  id: string;
  title: string;
  difficultyLevel: string;
  chapterName: string;
  unitName: string;
  chapterSlug: string;
  unitSlug: string;
}

// One result entry — extensible for future types (problems, theorems, tags…)
interface ResultItem {
  type: "unit" | "chapter" | "problem";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

const RECENT_KEY = "pl_recent_searches";
const MAX_RECENT = 8;
const POPULAR = [
  "Vieta's formulas",
  "Coordinate geometry",
  "Pigeonhole principle",
  "Cyclic quadrilateral",
  "Divisibility",
  "Graph theory",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  const prev = getRecent().filter((q) => q !== query);
  localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)));
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}

// Highlight matching characters inside a string
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/15 text-accent not-italic font-medium">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SearchBar({
  initialQuery = "",
  autoFocus = false,
  units = [],
  chapters = [],
  problems = [],
}: {
  initialQuery?: string;
  autoFocus?: boolean;
  units?: UnitData[];
  chapters?: ChapterData[];
  problems?: ProblemData[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(getRecent());
  }, [focused]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Live search — memoised
  const results = useMemo((): ResultItem[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: ResultItem[] = [];

    // Units
    for (const u of units) {
      if (u.name.toLowerCase().includes(q)) {
        items.push({
          type: "unit",
          id: u.id,
          label: u.name,
          sublabel: u.description ?? "Unit",
          href: `/units/${u.slug}`,
        });
      }
    }

    // Chapters
    for (const ch of chapters) {
      if (ch.name.toLowerCase().includes(q)) {
        items.push({
          type: "chapter",
          id: ch.id,
          label: ch.name,
          sublabel: `Chapter · ${ch.unitName}`,
          href: `/units/${ch.unitSlug}/${ch.slug}`,
        });
      }
    }

    // Problems
    for (const p of problems) {
      if (p.title.toLowerCase().includes(q)) {
        items.push({
          type: "problem",
          id: p.id,
          label: p.title,
          sublabel: `Problem · ${p.chapterName} · ${p.unitName}`,
          href: `/problems/${p.id}`,
        });
      }
    }

    return items;
  }, [query, units, chapters, problems]);

  // Group by type for display
  const grouped = useMemo(() => {
    const unitResults = results.filter((r) => r.type === "unit");
    const chapterResults = results.filter((r) => r.type === "chapter");
    const problemResults = results.filter((r) => r.type === "problem");
    return [
      ...(unitResults.length ? [{ label: "Units", icon: "📘", items: unitResults }] : []),
      ...(chapterResults.length ? [{ label: "Chapters", icon: "📖", items: chapterResults }] : []),
      ...(problemResults.length ? [{ label: "Problems", icon: "🧩", items: problemResults }] : []),
    ];
  }, [results]);

  // Flat navigable list for keyboard nav
  const flat = useMemo(() => results.slice(0, 12), [results]);

  const showDropdown = focused && (query.trim().length > 0 || recent.length > 0 || POPULAR.length > 0);
  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && results.length === 0;

  const navigate = useCallback(
    (href: string, q?: string) => {
      if (q) saveRecent(q);
      setFocused(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (activeIndex >= 0 && flat[activeIndex]) {
      navigate(flat[activeIndex].href, q);
    } else {
      saveRecent(q);
      setFocused(false);
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setFocused(false);
      setQuery("");
      return;
    }
    if (!showDropdown || flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    }
  }

  // Reset active index when results change
  useEffect(() => setActiveIndex(-1), [query]);

  // Build flat index offset map for keyboard highlighting across groups
  let flatIdx = 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search a concept — cyclic quadrilateral, vieta, pigeonhole..."
            className="w-full rounded-lg border border-line bg-white py-3.5 pl-11 pr-10 text-sm text-ink placeholder:text-ink-faint shadow-card focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-line bg-white shadow-lg">

          {/* ── Live results ── */}
          {hasQuery && !noResults && grouped.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink-faint border-b border-line/50">
                <span>{group.icon}</span>
                <span>{group.label}</span>
              </div>
              {group.items.slice(0, 5).map((item) => {
                const iIdx = flatIdx++;
                const isActive = activeIndex === iIdx;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => navigate(item.href, query)}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 transition-colors",
                      isActive ? "bg-accent/8" : "hover:bg-ink/[0.03]"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        <Highlight text={item.label} query={query} />
                      </p>
                      <p className="text-xs text-ink-faint">{item.sublabel}</p>
                    </div>
                    {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent" />}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* ── No results ── */}
          {noResults && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-ink-soft">No results found.</p>
              <p className="mt-1 text-xs text-ink-faint">
                Try another keyword or{" "}
                <Link href="/" className="text-accent hover:underline" onClick={() => setFocused(false)}>
                  browse by unit
                </Link>
                .
              </p>
            </div>
          )}

          {/* ── View all results ── */}
          {hasQuery && !noResults && (
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={() => { saveRecent(query.trim()); setFocused(false); }}
              className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm text-ink-soft hover:bg-ink/[0.03] hover:text-accent transition-colors"
            >
            <span>
  View all results for{" "}
  <span className="font-medium text-ink">
    {"“"}
    {query.trim()}
    {"”"}
  </span>
</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {/* ── Recent searches (shown when input is empty) ── */}
          {!hasQuery && recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-line/50">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">Recent</span>
                <button
                  onClick={() => { clearRecent(); setRecent([]); }}
                  className="text-xs text-ink-faint hover:text-ink-soft transition-colors"
                >
                  Clear
                </button>
              </div>
              {recent.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); inputRef.current?.focus(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ink/[0.03] transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                  <span className="text-sm text-ink-soft">{q}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Popular searches (shown when no recent history) ── */}
          {!hasQuery && recent.length === 0 && (
            <div>
              <div className="px-4 py-2 border-b border-line/50">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">Popular</span>
              </div>
              {POPULAR.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); inputRef.current?.focus(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ink/[0.03] transition-colors"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                  <span className="text-sm text-ink-soft">{q}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}