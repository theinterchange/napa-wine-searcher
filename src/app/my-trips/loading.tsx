export default function MyTripsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-8 w-36 rounded-lg bg-[var(--muted)] animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <div className="h-5 w-2/3 rounded bg-[var(--muted)] animate-pulse" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[var(--muted)] animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-[var(--muted)] animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-[var(--muted)] animate-pulse" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-4 w-20 rounded bg-[var(--muted)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
