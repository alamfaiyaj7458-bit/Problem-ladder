export function TagChip({ tag }: { tag: string }) {
  return (
    <span className="rounded-full bg-ink/5 px-2.5 py-1 font-mono text-xs text-ink-soft">
      {tag}
    </span>
  );
}
