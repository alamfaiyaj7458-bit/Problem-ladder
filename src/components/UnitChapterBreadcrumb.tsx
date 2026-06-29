import Link from "next/link";

export function UnitChapterBreadcrumb({
  unitName,
  unitSlug,
  chapterName,
  chapterSlug
}: {
  unitName: string;
  unitSlug: string;
  chapterName: string;
  chapterSlug: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Link href={`/units/${unitSlug}`} className="text-ink-soft hover:text-accent">
        {unitName}
      </Link>
      <span className="text-ink-faint">/</span>
      <Link href={`/units/${unitSlug}/${chapterSlug}`} className="font-medium text-ink hover:text-accent">
        {chapterName}
      </Link>
    </div>
  );
}
