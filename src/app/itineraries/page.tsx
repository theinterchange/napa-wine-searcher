import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, PenLine } from "lucide-react";
import { db } from "@/db";
import { dayTripRoutes, dayTripStops, wineries } from "@/db/schema";
import { sql, asc, eq, isNotNull, inArray, and } from "drizzle-orm";
import { CuratedLibrary } from "@/components/itinerary/CuratedLibrary";
import type { CuratedTripCard } from "@/components/itinerary/CuratedTripGallery";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Napa & Sonoma Itineraries | Napa Sonoma Guide",
  description:
    "Hand-picked Napa and Sonoma trip itineraries. Build your own from preferences, describe the trip you want and get matched with verified wineries, or start from a curated route.",
  alternates: { canonical: `${BASE_URL}/itineraries` },
};

async function loadCuratedTripsWithCounts(): Promise<CuratedTripCard[]> {
  type Row = {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    region: string | null;
    theme: string | null;
    estimatedHours: number | null;
    heroImageUrl: string | null;
    groupVibe: string | null;
    duration: string | null;
    fallbackImageUrl: string | null;
  };

  let rows: Row[];
  try {
    const baseRows = await db
      .select({
        id: dayTripRoutes.id,
        slug: dayTripRoutes.slug,
        title: dayTripRoutes.title,
        description: dayTripRoutes.description,
        region: dayTripRoutes.region,
        theme: dayTripRoutes.theme,
        estimatedHours: dayTripRoutes.estimatedHours,
        heroImageUrl: dayTripRoutes.heroImageUrl,
        groupVibe: dayTripRoutes.groupVibe,
        duration: dayTripRoutes.duration,
      })
      .from(dayTripRoutes)
      .orderBy(asc(dayTripRoutes.title));

    // Second pass: per-route fallback image from the first stop with an image.
    // Done in one query across all routes; de-duplicated in JS.
    const routeIds = baseRows.map((r) => r.id);
    const stopImages =
      routeIds.length > 0
        ? await db
            .select({
              routeId: dayTripStops.routeId,
              stopOrder: dayTripStops.stopOrder,
              heroImageUrl: wineries.heroImageUrl,
            })
            .from(dayTripStops)
            .innerJoin(wineries, eq(dayTripStops.wineryId, wineries.id))
            .where(
              and(
                inArray(dayTripStops.routeId, routeIds),
                isNotNull(wineries.heroImageUrl)
              )
            )
            .orderBy(asc(dayTripStops.routeId), asc(dayTripStops.stopOrder))
        : [];
    const firstImageByRoute = new Map<number, string>();
    for (const s of stopImages) {
      if (!firstImageByRoute.has(s.routeId) && s.heroImageUrl) {
        firstImageByRoute.set(s.routeId, s.heroImageUrl);
      }
    }

    rows = baseRows.map((r) => ({
      ...r,
      fallbackImageUrl: firstImageByRoute.get(r.id) ?? null,
    }));
  } catch (err) {
    console.warn(
      "[itineraries] Falling back to pre-migration dayTripRoutes query. Run `npm run db:push` to apply migration 0013.",
      err
    );
    const legacy = await db
      .select({
        id: dayTripRoutes.id,
        slug: dayTripRoutes.slug,
        title: dayTripRoutes.title,
        description: dayTripRoutes.description,
        region: dayTripRoutes.region,
        theme: dayTripRoutes.theme,
        estimatedHours: dayTripRoutes.estimatedHours,
      })
      .from(dayTripRoutes)
      .orderBy(asc(dayTripRoutes.title));
    rows = legacy.map((r) => ({
      ...r,
      heroImageUrl: null,
      groupVibe: null,
      duration: null,
      fallbackImageUrl: null,
    }));
  }

  const counts = await db
    .select({
      routeId: dayTripStops.routeId,
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(dayTripStops)
    .groupBy(dayTripStops.routeId);

  const countMap = new Map(counts.map((c) => [c.routeId, c]));

  return rows.map((r) => {
    const meta = countMap.get(r.id);
    return {
      slug: r.slug,
      title: r.title,
      description: r.description,
      region: r.region,
      theme: r.theme,
      estimatedHours: r.estimatedHours,
      heroImageUrl: r.heroImageUrl,
      groupVibe: r.groupVibe,
      duration: r.duration,
      fallbackImageUrl: r.fallbackImageUrl,
      stopCount: Number(meta?.count ?? 0),
    };
  });
}

export default async function ItinerariesLandingPage() {
  const trips = await loadCuratedTripsWithCounts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Plan your Napa & Sonoma trip
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
          Build your own from a few preferences, describe the trip you want, or
          start from a curated route. Every stop is editable — swap, add, or
          remove anytime.
        </p>
      </header>

      <section className="mb-12 grid gap-3 sm:grid-cols-2">
        <Link
          href="/itineraries/build"
          className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-md"
        >
          <PenLine className="h-6 w-6 text-burgundy-900" />
          <h2 className="mt-3 font-serif text-lg font-semibold">Build your own</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            A few questions, then a full itinerary tailored to your group.
          </p>
        </Link>
        <Link
          href="/itineraries/describe"
          className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-md"
        >
          <Sparkles className="h-6 w-6 text-burgundy-900" />
          <h2 className="mt-3 font-serif text-lg font-semibold">Describe your trip</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Tell us what you love; we'll match you to verified wineries.
          </p>
        </Link>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="font-serif text-2xl font-semibold">
            Or start with a hand-picked trip
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Editorial itineraries chosen by the guide team. Customize any of
            them the moment you land on the trip page.
          </p>
        </header>
        <CuratedLibrary trips={trips} />
      </section>
    </main>
  );
}
