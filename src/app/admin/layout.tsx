import "katex/dist/katex.min.css";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  // Middleware already redirects non-admins away from /admin; this is a
  // second check so the layout never renders admin-only data by accident.
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex gap-10">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}