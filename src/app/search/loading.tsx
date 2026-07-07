export default function SearchLoading() {
  return (
    <main className="mx-auto max-w-3xl animate-pulse px-6 py-12">
      <div className="h-12 w-full rounded-full bg-ink/8" />
      <div className="mt-8 grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-ink/8" />
        ))}
      </div>
    </main>
  );
}