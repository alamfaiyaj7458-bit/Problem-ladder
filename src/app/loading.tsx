export default function HomeLoading() {
  return (
    <main className="mx-auto max-w-5xl animate-pulse px-6 py-16">
      {/* Hero */}
      <section className="mx-auto max-w-2xl text-center">
        <div className="mx-auto h-10 w-3/4 rounded-lg bg-ink/8" />
        <div className="mx-auto mt-3 h-10 w-1/2 rounded-lg bg-ink/8" />
        <div className="mx-auto mt-2 h-5 w-64 rounded bg-ink/8" />
        <div className="mx-auto mt-8 h-12 max-w-lg rounded-full bg-ink/8" />
      </section>

      {/* Unit grid */}
      <section className="mt-16">
        <div className="mb-4 h-3 w-28 rounded bg-ink/8" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-ink/8" />
          ))}
        </div>
      </section>
    </main>
  );
}