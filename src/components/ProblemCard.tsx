import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { TagChip } from "@/components/TagChip";
import type { DifficultyLevel } from "@/lib/types";

export function ProblemCard({
  id,
  title,
  level,
  score,
  tags,
  solved
}: {
  id: string;
  title: string;
  level: DifficultyLevel;
  score?: number | null;
  tags: string[];
  solved?: boolean;
}) {
  return (
    <Link
      href={`/problems/${id}`}
      className="block rounded-lg border border-line bg-paper-raised p-4 shadow-card transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {solved && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
          <h3 className="font-serif text-base text-ink">{title}</h3>
        </div>
        <DifficultyBadge level={level} score={score} />
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 5).map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
      )}
    </Link>
  );
}