import Link from "next/link";
import { db } from "@/db";
import { dayTripRoutes, dayTripStops } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminRoutesListPage() {
  const rows = await db
    .select({
      id: dayTripRoutes.id,
      slug: dayTripRoutes.slug,
      title: dayTripRoutes.title,
      region: dayTripRoutes.region,
      theme: dayTripRoutes.theme,
      duration: dayTripRoutes.duration,
      heroImageUrl: dayTripRoutes.heroImageUrl,
      editorialPull: dayTripRoutes.editorialPull,
      curatedAt: dayTripRoutes.curatedAt,
    })
    .from(dayTripRoutes)
    .orderBy(asc(dayTripRoutes.title));

  const counts = await db
    .select({
      routeId: dayTripStops.routeId,
      count: sql<number>`COUNT(*)`.as("c"),
      featuredCount: sql<number>`SUM(CASE WHEN ${dayTripStops.isFeatured} = 1 THEN 1 ELSE 0 END)`.as(
        "fc"
      ),
    })
    .from(dayTripStops)
    .groupBy(dayTripStops.routeId);
  const countMap = new Map(counts.map((c) => [c.routeId, c]));

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Curated routes</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Pick the stops that appear on each `/itineraries/[slug]` page. Mark
            featured slots to pin editorial or sponsor placements.
          </p>
        </div>
      </header>

      <ul className="space-y-3">
        {rows.map((r) => {
          const meta = countMap.get(r.id);
          return (
            <li key={r.id}>
              <Link
                href={`/nalaadmin/routes/${r.slug}`}
                className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                    {r.region && <span>{r.region}</span>}
                    {r.theme && <span>· {r.theme}</span>}
                    {r.duration && <span>· {r.duration}</span>}
                  </div>
                  <h2 className="mt-1 font-serif text-lg font-semibold">
                    {r.title}
                  </h2>
                  {r.editorialPull && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-[var(--muted-foreground)]">
                      {r.editorialPull}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-[var(--muted-foreground)]">
                  <div>{Number(meta?.count ?? 0)} stops</div>
                  {Number(meta?.featuredCount ?? 0) > 0 && (
                    <div className="text-[#8b6508]">
                      {Number(meta?.featuredCount ?? 0)} featured
                    </div>
                  )}
                  {r.curatedAt && (
                    <div className="mt-1">
                      {new Date(r.curatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
