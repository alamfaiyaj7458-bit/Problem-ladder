"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/units", label: "Units & chapters" },
  { href: "/admin/problems", label: "Review queue" },
  { href: "/admin/problems/new", label: "New problem" },
  { href: "/admin/problems/generate", label: "AI generation" },
  { href: "/admin/problems/discover", label: "Internet discovery" }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 space-y-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm",
              active ? "bg-accent-soft text-accent-ink font-medium" : "text-ink-soft hover:bg-ink/5"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
