export default function WineriesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-48 rounded-lg bg-[var(--muted)] animate-pulse" />
        <div className="mt-2 h-5 w-32 rounded bg-[var(--muted)] animate-pulse" />
      </div>

      <div className="mb-6">
        <div className="h-10 w-full rounded-lg bg-[var(--muted)] animate-pulse" />
      </div>

      <div className="mb-8">
        <div className="h-10 w-64 rounded-lg bg-[var(--muted)] animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
          >
            <div className="aspect-[16/9] bg-[var(--muted)] animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-[var(--muted)] animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-[var(--muted)] animate-pulse" />
              <div className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
              <div className="flex justify-between">
                <div className="h-4 w-16 rounded bg-[var(--muted)] animate-pulse" />
                <div className="h-4 w-10 rounded bg-[var(--muted)] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
