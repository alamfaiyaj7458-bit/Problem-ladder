export default function ChapterLoading() {
  return (
    <main className="mx-auto max-w-5xl animate-pulse px-6 py-12">
      <div className="h-3.5 w-24 rounded bg-ink/8" />
      <div className="mt-4 h-3 w-56 rounded bg-ink/8" />
      <div className="mt-2 h-8 w-64 rounded-lg bg-ink/8" />
      <div className="mt-1.5 h-4 w-80 rounded bg-ink/8" />

      {/* Difficulty switcher */}
      <div className="mt-10 rounded-lg border border-line bg-paper-raised p-6">
        <div className="mb-5 h-4 w-40 rounded bg-ink/8" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 flex-1 rounded-lg bg-ink/8" />
          ))}
        </div>
      </div>
    </main>
  );
}