export default function PlanTripLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-56 rounded-lg bg-[var(--muted)] animate-pulse" />
        <div className="mt-2 h-5 w-80 rounded bg-[var(--muted)] animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Map placeholder */}
        <div className="aspect-[4/3] rounded-xl bg-[var(--muted)] animate-pulse" />

        {/* Controls placeholder */}
        <div className="space-y-4">
          <div className="h-10 w-full rounded-lg bg-[var(--muted)] animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-[var(--muted)] animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="h-5 w-3/4 rounded bg-[var(--muted)] animate-pulse" />
              <div className="mt-2 h-4 w-1/2 rounded bg-[var(--muted)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
