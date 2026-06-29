import type { DifficultyLevel } from "./types";

// Mirrors the `difficulty_level` generated column in 0001_init.sql exactly.
// If you ever change the bands, update both places.
export const DIFFICULTY_LEVELS: { level: DifficultyLevel; min: number; max: number }[] = [
  { level: "beginner", min: 0, max: 19.99 },
  { level: "intermediate", min: 20, max: 39.99 },
  { level: "advanced", min: 40, max: 59.99 },
  { level: "expert", min: 60, max: 79.99 },
  { level: "master", min: 80, max: 100 }
];

export function scoreToLevel(score: number): DifficultyLevel {
  const clamped = Math.min(100, Math.max(0, score));
  // Mirrors the DB generated column's cascading `<` checks exactly (see
  // 0001_init.sql). Using min/max range lookups here previously left a gap
  // between e.g. 19.99 and 20 for non-2-decimal scores (raw AI output before
  // it's rounded by the numeric(5,2) column), silently falling back to
  // "beginner" instead of the correct band.
  if (clamped < 20) return "beginner";
  if (clamped < 40) return "intermediate";
  if (clamped < 60) return "advanced";
  if (clamped < 80) return "expert";
  return "master";
}

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
  master: "Master"
};

export const DIFFICULTY_ORDER: DifficultyLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
  "master"
];

// Tailwind color tokens for each level (see tailwind.config.ts `level.*`).
export const DIFFICULTY_COLOR: Record<DifficultyLevel, { text: string; bg: string; border: string }> = {
  beginner: { text: "text-level-beginner", bg: "bg-level-beginner-soft", border: "border-level-beginner" },
  intermediate: { text: "text-level-intermediate", bg: "bg-level-intermediate-soft", border: "border-level-intermediate" },
  advanced: { text: "text-level-advanced", bg: "bg-level-advanced-soft", border: "border-level-advanced" },
  expert: { text: "text-level-expert", bg: "bg-level-expert-soft", border: "border-level-expert" },
  master: { text: "text-level-master", bg: "bg-level-master-soft", border: "border-level-master" }
};
