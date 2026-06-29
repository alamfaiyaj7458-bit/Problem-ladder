import { NextResponse } from "next/server";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import { findSimilarProblems } from "@/lib/duplicate-detection";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { title, statement, chapterId, excludeId } = await request.json();
  if (!title || !statement || !chapterId) {
    return NextResponse.json({ error: "title, statement, and chapterId are required" }, { status: 400 });
  }

  const supabase = await createClient();
  try {
    const matches = await findSimilarProblems(supabase, { title, statement, chapterId, excludeId });
    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
