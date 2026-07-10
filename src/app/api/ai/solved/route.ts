import { NextRequest, NextResponse } from "next/server";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const chapterId = req.nextUrl.searchParams.get("chapter");
  if (!chapterId) return NextResponse.json([]);

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json([]);

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_submissions")
    .select("problem_id, problems!inner(chapter_id)")
    .eq("user_id", profile.id)
    .eq("is_correct", true)
    .eq("problems.chapter_id", chapterId);

  return NextResponse.json((data ?? []).map((s) => s.problem_id));
}