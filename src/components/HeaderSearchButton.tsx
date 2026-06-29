"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

export function HeaderSearchButton() {
  const router = useRouter();
  const pathname = usePathname();

  function handleClick() {
    if (pathname === "/") {
      // Already on home — focus the search input directly
      const input = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
      input?.focus();
    } else {
      router.push("/#search");
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Search problems"
      className="text-ink-soft hover:text-accent transition-colors"
    >
      <Search className="h-4 w-4" />
    </button>
  );
}