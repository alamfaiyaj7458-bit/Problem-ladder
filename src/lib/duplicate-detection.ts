import type { SupabaseClient } from "@supabase/supabase-js";
import type { SimilarProblem } from "@/lib/types";

export async function findSimilarProblems(
  supabase: SupabaseClient,
  args: { title: string; statement: string; chapterId: string; excludeId?: string }
): Promise<SimilarProblem[]> {
  const { data, error } = await supabase.rpc("find_similar_problems", {
    p_title: args.title,
    p_statement: args.statement,
    p_chapter_id: args.chapterId,
    p_exclude_id: args.excludeId ?? null
  });

  if (error) throw error;
  return data ?? [];
}
