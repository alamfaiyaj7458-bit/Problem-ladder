import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Field";
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

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="font-serif text-2xl text-ink">Account</h1>

      <Card className="mt-6 p-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile.display_name ?? "Avatar"}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-line"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-2xl font-serif text-accent select-none">
              {(profile.display_name ?? email ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-serif text-xl text-ink truncate">
              {profile.display_name || "No name set"}
            </p>
            <p className="mt-0.5 text-sm text-ink-faint capitalize">{profile.role}</p>
          </div>
        </div>

        {/* Account details */}
        <dl className="mt-6 divide-y divide-line text-sm">
          {email && (
            <div className="flex justify-between py-3">
              <dt className="text-ink-soft">Email</dt>
              <dd className="text-ink truncate max-w-[60%] text-right">{email}</dd>
            </div>
          )}
          <div className="flex justify-between py-3">
            <dt className="text-ink-soft">Joined</dt>
            <dd className="text-ink">{joinedDate}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-ink-soft">Account type</dt>
            <dd className="text-ink capitalize">{profile.role}</dd>
          </div>
        </dl>
      </Card>

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="text-sm text-ink-soft hover:text-accent"
        >
          ← Back to dashboard
        </Link>
        <Link
          href="/login"
          className="text-sm text-ink-soft hover:text-accent"
        >
          Sign out
        </Link>
      </div>
    </main>
  );
}
