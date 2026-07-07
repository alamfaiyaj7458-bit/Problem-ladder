export default function ProblemLoading() {
  return (
    <main className="mx-auto max-w-2xl animate-pulse px-6 py-12">
      <div className="h-3.5 w-24 rounded bg-ink/8" />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="h-3 w-48 rounded bg-ink/8" />
        <div className="h-6 w-20 rounded-full bg-ink/8" />
      </div>

      {/* Title */}
      <div className="mt-6 h-7 w-3/4 rounded-lg bg-ink/8" />

      {/* Statement */}
      <div className="mt-6 mb-10 space-y-2">
        <div className="h-6 w-full rounded bg-ink/8" />
        <div className="h-6 w-5/6 rounded bg-ink/8" />
        <div className="h-6 w-4/6 rounded bg-ink/8" />
      </div>

      {/* Answer area */}
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-ink/8" />
        <div className="h-12 w-full rounded-lg bg-ink/8" />
        <div className="h-9 w-28 rounded-md bg-ink/8" />
        <div className="flex gap-3">
          <div className="h-9 w-24 rounded-md bg-ink/8" />
          <div className="h-9 w-24 rounded-md bg-ink/8" />
        </div>
      </div>
    </main>
  );
}