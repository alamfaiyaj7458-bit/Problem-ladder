export default function UnitLoading() {
  return (
    <main className="mx-auto max-w-5xl animate-pulse px-6 py-12">
      <div className="h-3.5 w-20 rounded bg-ink/8" />
      <div className="mt-4 h-3 w-48 rounded bg-ink/8" />
      <div className="mt-2 h-8 w-56 rounded-lg bg-ink/8" />
      <div className="mt-1.5 h-4 w-72 rounded bg-ink/8" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-ink/8" />
        ))}
      </div>
    </main>
  );
}