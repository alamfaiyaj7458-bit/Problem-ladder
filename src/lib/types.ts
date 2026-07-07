export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert" | "master";

export type ProblemStatus = "draft" | "review" | "published";

export type ProblemSource = "manual" | "ai_generated" | "internet" | "olympiad_archive" | "modified";

export type SolutionSource = "manual" | "ai_generated" | "ai_assisted";

export type SolutionStatus = "draft" | "review" | "published";

export type CandidateStatus = "pending" | "approved" | "rejected";

export type UserRole = "student" | "admin";

export interface Unit {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  unit_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  id: string;
  chapter_id: string;
  title: string;
  statement: string;
  difficulty_score: number;
  difficulty_level: DifficultyLevel;
  tags: string[];
  status: ProblemStatus;
  source: ProblemSource;
  source_url: string | null;
  source_notes: string | null;
  options: string[] | null;
  correct_option: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ProblemWithContext extends Problem {
  chapter_name: string;
  chapter_slug: string;
  unit_id: string;
  unit_name: string;
  unit_slug: string;
}

export interface Solution {
  id: string;
  problem_id: string;
  content: string;
  source: SolutionSource;
  ai_workflow_log: AiSolutionWorkflowLog | null;
  status: SolutionStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiSolutionWorkflowLog {
  generated: string;
  verification: { is_correct: boolean; issues: string[] };
  critique: { critique: string; suggested_fixes: string[] } | null;
  fixed: string | null;
}

export interface ProblemCandidate {
  id: string;
  unit_id: string | null;
  chapter_id: string | null;
  title: string;
  statement: string;
  suggested_difficulty_score: number | null;
  suggested_tags: string[];
  source_url: string | null;
  status: CandidateStatus;
  promoted_problem_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface AiGenerationJob {
  id: string;
  unit_id: string | null;
  chapter_id: string | null;
  target_level: DifficultyLevel | null;
  requested_count: number;
  generated_count: number;
  status: "completed" | "failed" | "partial";
  error_message: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface SimilarProblem {
  id: string;
  title: string;
  status: ProblemStatus;
  similarity: number;
}

export interface SearchResult {
  id: string;
  title: string;
  statement: string;
  difficulty_score: number;
  difficulty_level: DifficultyLevel;
  tags: string[];
  chapter_id: string;
  chapter_name: string;
  unit_id: string;
  unit_name: string;
  rank: number;
}