import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LayoutDashboard, ShieldCheck, LogOut, Mail, CalendarDays, BadgeCheck } from "lucide-react";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/profile");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  const email = user?.email ?? null;
  const avatarUrl: string | null =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const joinedDate = formatDate(profile.created_at);
  const initial = (profile.display_name ?? email ?? "?")[0].toUpperCase();

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-accent transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      <h1 className="mt-5 font-serif text-2xl text-ink">Account</h1>

      {/* Profile card */}
      <div className="mt-4 rounded-2xl border border-line bg-white shadow-sm overflow-hidden">

        {/* Header band */}
        <div className="h-24 bg-gradient-to-br from-accent/80 to-accent" />

        {/* Avatar — overlaps the band */}
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={profile.display_name ?? "Avatar"}
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl font-serif text-white ring-4 ring-white shadow select-none">
                {initial}
              </div>
            )}
            {profile.role === "admin" && (
              <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </span>
            )}
          </div>

          <p className="font-serif text-xl text-ink">
            {profile.display_name || "No name set"}
          </p>
          {email && (
            <p className="mt-0.5 text-sm text-ink-faint">{email}</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-line" />

        {/* Details */}
        <dl className="divide-y divide-line text-sm">
          {email && (
            <div className="flex items-center gap-3 px-6 py-3.5">
              <Mail className="h-4 w-4 shrink-0 text-ink-faint" />
              <dt className="w-28 shrink-0 text-ink-soft">Email</dt>
              <dd className="truncate text-ink">{email}</dd>
            </div>
          )}
          <div className="flex items-center gap-3 px-6 py-3.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-ink-faint" />
            <dt className="w-28 shrink-0 text-ink-soft">Joined</dt>
            <dd className="text-ink">{joinedDate}</dd>
          </div>
          <div className="flex items-center gap-3 px-6 py-3.5">
            <BadgeCheck className="h-4 w-4 shrink-0 text-ink-faint" />
            <dt className="w-28 shrink-0 text-ink-soft">Account type</dt>
            <dd className="text-ink capitalize">{profile.role}</dd>
          </div>
        </dl>
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink hover:border-line-strong hover:bg-ink/[0.02] transition-colors"
        >
          <LayoutDashboard className="h-4 w-4 text-ink-faint" />
          Go to Dashboard
        </Link>
        {profile.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink hover:border-line-strong hover:bg-ink/[0.02] transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-ink-faint" />
            Admin panel
          </Link>
        )}
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-xl border border-red-100 bg-white px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Link>
      </div>
    </main>
  );
}