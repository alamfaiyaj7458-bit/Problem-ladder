import Link from "next/link";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NavDrawer } from "@/components/NavDrawer";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  const supabase = await createClient();
  const { data: units } = await supabase
    .from("units")
    .select("id, name, slug, chapters(id, name, slug)")
    .order("sort_order");

  const drawerUnits = (units ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    slug: u.slug,
    chapters: ((u as unknown as { chapters: { id: string; name: string; slug: string }[] }).chapters ?? [])
  }));

  return (
    <header className="border-b border-line bg-paper-raised">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <NavDrawer units={drawerUnits} />
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <LadderMark />
            <span className="truncate font-serif text-lg text-ink">Problem Ladder</span>
          </Link>
        </div>
        <nav className="flex shrink-0 items-center gap-5 text-sm">
          {profile ? (
            <>
              <Link href="/" aria-label="Home" className="text-ink-soft hover:text-accent transition-colors">
                <Home className="h-5 w-5" />
              </Link>
              <Link href="/dashboard" aria-label="Dashboard" className="text-ink-soft hover:text-accent transition-colors">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
              <Link href="/profile" aria-label="Profile" className="text-ink-soft hover:text-accent transition-colors">
                <UserCircle className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-ink-soft hover:text-accent">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function LadderMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2" y="2" width="3" height="16" rx="1" fill="#2451FF" />
      <rect x="15" y="2" width="3" height="16" rx="1" fill="#2451FF" />
      <rect x="2" y="3" width="16" height="2" rx="1" fill="#2451FF" />
      <rect x="2" y="9" width="16" height="2" rx="1" fill="#2451FF" />
      <rect x="2" y="15" width="16" height="2" rx="1" fill="#2451FF" />
    </svg>
  );
}