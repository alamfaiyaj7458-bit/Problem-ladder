import Link from "next/link";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABEL, DIFFICULTY_ORDER, DIFFICULTY_COLOR } from "@/lib/difficulty";
import type { DifficultyLevel } from "@/lib/types";

const BAR_HEIGHT: Record<DifficultyLevel, string> = {
  beginner: "h-6",
  intermediate: "h-9",
  advanced: "h-12",
  expert: "h-16",
  master: "h-20"
};

const DOT_COLOR: Record<DifficultyLevel, string> = {
  beginner: "bg-level-beginner",
  intermediate: "bg-level-intermediate",
  advanced: "bg-level-advanced",
  expert: "bg-level-expert",
  master: "bg-level-master"
};

/** Small pill for the problem page's top-right corner. */
export function DifficultyBadge({ level, score }: { level: DifficultyLevel; score?: number | null }) {
  const c = DIFFICULTY_COLOR[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide",
        c.bg,
        c.text,
        c.border
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_COLOR[level])} />
      {score != null ? `${Math.round(score)}/100` : DIFFICULTY_LABEL[level]}
    </span>
  );
}

/**
 * The ladder: five ascending rungs, one per difficulty level. Used as the
 * level switcher on a chapter page — it doubles as the product's signature
 * visual, since it's literally what "Problem Ladder" means.
 */
export function LadderSwitcher({
  baseHref,
  current,
  counts
}: {
  baseHref: string;
  current?: DifficultyLevel;
  counts: Partial<Record<DifficultyLevel, number>>;
}) {
  return (
    <div className="flex items-end gap-3 sm:gap-4" role="group" aria-label="Choose a difficulty level">
      {DIFFICULTY_ORDER.map((level) => {
        const isActive = current === level;
        const count = counts[level] ?? 0;
        return (
          <Link
            key={level}
            href={`${baseHref}?level=${level}`}
            className="group flex flex-col items-center gap-2"
            aria-current={isActive ? "true" : undefined}
          >
            <span className="font-mono text-[11px] text-ink-faint">{count}</span>
            <span
              className={cn(
                "w-9 sm:w-11 rounded-md transition-all",
                BAR_HEIGHT[level],
                DOT_COLOR[level],
                isActive ? "shadow-rung opacity-100" : "opacity-40 group-hover:opacity-70"
              )}
            />
            <span
              className={cn(
                "text-xs font-medium",
                isActive ? "text-ink" : "text-ink-faint group-hover:text-ink-soft"
              )}
            >
              {DIFFICULTY_LABEL[level]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}