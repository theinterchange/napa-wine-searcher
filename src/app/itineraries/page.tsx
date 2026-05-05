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
      <header className="mb-10 pb-5 border-b border-[var(--rule)]">
        <span className="kicker">Itineraries</span>
        <h1 className="editorial-h2 text-[36px] sm:text-[44px] mt-2">
          Plan your Napa &amp; Sonoma <em>trip.</em>
        </h1>
        <p className="mt-4 font-[var(--font-serif-text)] text-[17px] leading-[1.5] text-[var(--ink-2)] max-w-[60ch]">
          Build from a few preferences or start with a curated route — every
          stop editable.
        </p>
      </header>

      <section className="mb-12 grid gap-3 sm:grid-cols-2">
        <Link
          href="/itineraries/build"
          className="group flex flex-col bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-5 transition-colors"
        >
          <PenLine className="h-6 w-6 text-[var(--brass)]" />
          <h2 className="mt-3 font-[var(--font-heading)] text-[19px] text-[var(--ink)] leading-tight">Build your own</h2>
          <p className="mt-1.5 font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
            A few questions, then a full itinerary tailored to your group.
          </p>
        </Link>
        <Link
          href="/itineraries/describe"
          className="group flex flex-col bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-5 transition-colors"
        >
          <Sparkles className="h-6 w-6 text-[var(--brass)]" />
          <h2 className="mt-3 font-[var(--font-heading)] text-[19px] text-[var(--ink)] leading-tight">Describe your trip</h2>
          <p className="mt-1.5 font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
            Tell us what you love; we&apos;ll match you to verified wineries.
          </p>
        </Link>
      </section>

      <section>
        <header className="mb-5">
          <span className="kicker">The Library</span>
          <h2 className="editorial-h2 text-[24px] sm:text-[30px] mt-2">
            Or start with a hand-picked <em>trip.</em>
          </h2>
          <p className="mt-2 font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
            Editorial itineraries chosen by the guide team. Customize any of
            them the moment you land on the trip page.
          </p>
        </header>
        <CuratedLibrary trips={trips} />
      </section>
    </main>
  );
}
