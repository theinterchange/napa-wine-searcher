import { notFound } from "next/navigation";
import { db } from "@/db";
import { dayTripRoutes, dayTripStops, wineries, subRegions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getPoolForTheme } from "@/lib/itinerary/pool";
import { RouteEditor, type AdminStop, type AdminPoolItem } from "./RouteEditor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminRouteEditPage({ params }: Props) {
  const { slug } = await params;

  const [route] = await db
    .select()
    .from(dayTripRoutes)
    .where(eq(dayTripRoutes.slug, slug))
    .limit(1);
  if (!route) notFound();

  const stopRows = await db
    .select({
      wineryId: dayTripStops.wineryId,
      stopOrder: dayTripStops.stopOrder,
      notes: dayTripStops.notes,
      suggestedDuration: dayTripStops.suggestedDuration,
      isFeatured: dayTripStops.isFeatured,
      valleyVariant: dayTripStops.valleyVariant,
      name: wineries.name,
      slug: wineries.slug,
      city: wineries.city,
      subRegion: subRegions.name,
      heroImageUrl: wineries.heroImageUrl,
      rating: wineries.googleRating,
      priceLevel: wineries.priceLevel,
    })
    .from(dayTripStops)
    .innerJoin(wineries, eq(dayTripStops.wineryId, wineries.id))
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(dayTripStops.routeId, route.id))
    .orderBy(asc(dayTripStops.stopOrder));

  const initialStops: AdminStop[] = stopRows.map((s) => ({
    wineryId: s.wineryId,
    name: s.name,
    slug: s.slug,
    city: s.city,
    subRegion: s.subRegion,
    heroImageUrl: s.heroImageUrl,
    rating: s.rating,
    priceLevel: s.priceLevel,
    notes: s.notes,
    suggestedDuration: s.suggestedDuration,
    isFeatured: s.isFeatured ?? false,
    valleyVariant: s.valleyVariant ?? "both",
  }));

  // Pre-compute the pool so initial render shows candidates immediately.
  const pool = await getPoolForTheme({
    theme: route.theme ?? null,
    valley: route.region ?? null,
    excludeIds: initialStops.map((s) => s.wineryId),
    limit: 24,
  });

  const initialPool: AdminPoolItem[] = pool.map((p) => ({
    wineryId: p.wineryId,
    name: p.name,
    slug: p.slug,
    city: p.city,
    subRegion: p.subRegion,
    heroImageUrl: p.heroImageUrl,
    rating: p.googleRating,
    priceLevel: p.priceLevel,
  }));

  return (
    <RouteEditor
      slug={route.slug}
      initial={{
        title: route.title,
        description: route.description,
        region: route.region,
        theme: route.theme,
        estimatedHours: route.estimatedHours,
        heroImageUrl: route.heroImageUrl,
        groupVibe: route.groupVibe,
        duration: route.duration,
        seoKeywords: route.seoKeywords,
        faqJson: route.faqJson,
        editorialPull: route.editorialPull,
      }}
      initialStops={initialStops}
      initialPool={initialPool}
    />
  );
}
