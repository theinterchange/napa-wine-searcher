export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="h-16 w-16 rounded-full bg-[var(--muted)] animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-[var(--muted)] animate-pulse" />
          <div className="h-4 w-48 rounded bg-[var(--muted)] animate-pulse" />
          <div className="h-4 w-56 rounded bg-[var(--muted)] animate-pulse" />
        </div>
      </div>

      {/* Sections */}
      {Array.from({ length: 3 }).map((_, s) => (
        <div key={s} className="mb-12">
          <div className="h-6 w-28 rounded bg-[var(--muted)] animate-pulse mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
              >
                <div className="aspect-[16/9] bg-[var(--muted)] animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 rounded bg-[var(--muted)] animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-[var(--muted)] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
