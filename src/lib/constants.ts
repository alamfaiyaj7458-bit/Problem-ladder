import type { ProblemSource, ProblemStatus, SolutionStatus } from "./types";

export const STATUS_LABEL: Record<ProblemStatus | SolutionStatus, string> = {
  draft: "Draft",
  review: "In review",
  published: "Published"
};

export const STATUS_COLOR: Record<ProblemStatus | SolutionStatus, string> = {
  draft: "bg-ink-faint/15 text-ink-soft",
  review: "bg-amber-soft text-amber",
  published: "bg-accent-soft text-accent-ink"
};

export const SOURCE_LABEL: Record<ProblemSource, string> = {
  manual: "Manual",
  ai_generated: "AI generated",
  internet: "Internet",
  olympiad_archive: "Olympiad archive",
  modified: "Modified"
};

export const NEXT_STATUS: Record<ProblemStatus, ProblemStatus | null> = {
  draft: "review",
  review: "published",
  published: null
};
