export default function GuidesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10">
        <div className="h-9 w-64 rounded-lg bg-[var(--muted)] animate-pulse" />
        <div className="mt-3 h-5 w-96 rounded bg-[var(--muted)] animate-pulse" />
      </div>

      <div className="space-y-12">
        {Array.from({ length: 3 }).map((_, s) => (
          <div key={s}>
            <div className="h-6 w-32 rounded bg-[var(--muted)] animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                >
                  <div className="h-4 w-3/4 rounded bg-[var(--muted)] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
