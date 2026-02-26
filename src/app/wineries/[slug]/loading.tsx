export default function WineryDetailLoading() {
  return (
    <>
      {/* Breadcrumb skeleton */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="h-5 w-64 rounded bg-[var(--muted)] animate-pulse" />
      </div>

      {/* Hero skeleton */}
      <div className="relative h-64 sm:h-80 bg-[var(--muted)] animate-pulse" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Info section skeleton */}
        <div className="mb-6 flex gap-3">
          <div className="h-10 w-32 rounded-lg bg-[var(--muted)] animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 w-48 rounded bg-[var(--muted)] animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-[var(--muted)] animate-pulse" />
              <div className="h-4 w-4/6 rounded bg-[var(--muted)] animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-5 w-24 rounded bg-[var(--muted)] animate-pulse" />
            <div className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
            <div className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-[var(--muted)] animate-pulse" />
          </div>
        </div>

        {/* Wines skeleton */}
        <div className="mt-8">
          <div className="h-7 w-24 rounded bg-[var(--muted)] animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
