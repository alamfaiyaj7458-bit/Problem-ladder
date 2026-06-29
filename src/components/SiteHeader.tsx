import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { HeaderSearchButton } from "@/components/HeaderSearchButton";
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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <NavDrawer units={drawerUnits} />
          <Link href="/" className="flex items-center gap-2">
            <LadderMark />
            <span className="font-serif text-lg text-ink">Problem Ladder</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <HeaderSearchButton />
          {profile ? (
            <>
              <Link href="/" className="text-ink-soft hover:text-accent">
                Home
              </Link>
              <Link href="/dashboard" className="text-ink-soft hover:text-accent">
                Dashboard
              </Link>
              <Link href="/profile" className="text-ink-soft hover:text-accent">
                Profile
              </Link>
              {profile.role === "admin" && (
                <Link href="/admin" className="text-ink-soft hover:text-accent">
                  Admin
                </Link>
              )}
              <Link href="/login" className="text-ink-soft hover:text-accent">
                Sign out
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