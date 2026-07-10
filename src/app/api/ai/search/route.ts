import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use edge runtime — no cold start, runs globally close to users
export const runtime = "edge";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  // Anon client is fine — problems table is publicly readable (RLS allows it)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("problems")
    .select("id, title, difficulty_level, chapters(name, slug, units(name, slug))")
    .eq("status", "published")
    .ilike("title", `%${q}%`)
    .limit(20);

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}