import Link from "next/link";
import { db } from "@/db";
import { wineries, subRegions, wines, wineTypes, tastingExperiences, wineryPhotos, dayTripRoutes, dayTripStops } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChevronRight, Route } from "lucide-react";
import { WineryHero } from "@/components/detail/WineryHero";
import { WineryInfoSection, HoursSection } from "@/components/detail/WineryInfoSection";
import { WineTable } from "@/components/detail/WineTable";
import { TastingTable } from "@/components/detail/TastingTable";
import { FavoriteButton } from "@/components/detail/FavoriteButton";
import { VisitedButton } from "@/components/detail/VisitedButton";
import { NotesEditor } from "@/components/detail/NotesEditor";
import { WantToVisitButton } from "@/components/detail/WantToVisitButton";
import { AddToJournalButton } from "@/components/detail/AddToJournalButton";
import { AddToCollectionButton } from "@/components/collections/AddToCollectionButton";
import { WineryCard } from "@/components/directory/WineryCard";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { ShareButton } from "@/components/social/ShareButton";
import { getMoreWineriesInRegion } from "@/lib/region-data";
import { wineryWinesUrl } from "@/lib/affiliate";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const all = await db.select({ slug: wineries.slug }).from(wineries);
  return all.map((w) => ({ slug: w.slug }));
}

const BASE_URL = "https://napa-winery-search.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [winery] = await db
    .select({
      name: wineries.name,
      shortDescription: wineries.shortDescription,
      heroImageUrl: wineries.heroImageUrl,
      city: wineries.city,
    })
    .from(wineries)
    .where(eq(wineries.slug, slug))
    .limit(1);

  if (!winery) return { title: "Winery Not Found" };

  const title = `${winery.name} | Wine Country Guide`;
  const description =
    winery.shortDescription || `Visit ${winery.name} in wine country`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/wineries/${slug}`,
      siteName: "Wine Country Guide",
      type: "website",
      ...(winery.heroImageUrl && {
        images: [{ url: winery.heroImageUrl, alt: winery.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(winery.heroImageUrl && { images: [winery.heroImageUrl] }),
    },
  };
}

export default async function WineryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [winery] = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      description: wineries.description,
      shortDescription: wineries.shortDescription,
      address: wineries.address,
      city: wineries.city,
      state: wineries.state,
      zip: wineries.zip,
      lat: wineries.lat,
      lng: wineries.lng,
      phone: wineries.phone,
      email: wineries.email,
      websiteUrl: wineries.websiteUrl,
      hoursJson: wineries.hoursJson,
      reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly,
      dogFriendlyNote: wineries.dogFriendlyNote,
      dogFriendlySource: wineries.dogFriendlySource,
      picnicFriendly: wineries.picnicFriendly,
      kidFriendly: wineries.kidFriendly,
      kidFriendlyNote: wineries.kidFriendlyNote,
      kidFriendlySource: wineries.kidFriendlySource,
      kidFriendlyConfidence: wineries.kidFriendlyConfidence,
      priceLevel: wineries.priceLevel,
      aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings,
      curated: wineries.curated,
      curatedAt: wineries.curatedAt,
      lastScrapedAt: wineries.lastScrapedAt,
      updatedAt: wineries.updatedAt,
      heroImageUrl: wineries.heroImageUrl,
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.slug, slug))
    .limit(1);

  if (!winery) notFound();

  const [wineryWines, tastings, photos, dayTrips] = await Promise.all([
    db
      .select({
        id: wines.id,
        name: wines.name,
        vintage: wines.vintage,
        price: wines.price,
        description: wines.description,
        rating: wines.rating,
        ratingSource: wines.ratingSource,
        ratingCount: wines.ratingCount,
        wineType: wineTypes.name,
        category: wineTypes.category,
      })
      .from(wines)
      .leftJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
      .where(eq(wines.wineryId, winery.id))
      .orderBy(asc(wineTypes.category), asc(wineTypes.name), asc(wines.name)),
    db
      .select()
      .from(tastingExperiences)
      .where(eq(tastingExperiences.wineryId, winery.id)),
    db
      .select({
        id: wineryPhotos.id,
        url: wineryPhotos.url,
        altText: wineryPhotos.altText,
      })
      .from(wineryPhotos)
      .where(eq(wineryPhotos.wineryId, winery.id)),
    db
      .select({
        slug: dayTripRoutes.slug,
        title: dayTripRoutes.title,
      })
      .from(dayTripStops)
      .innerJoin(dayTripRoutes, eq(dayTripStops.routeId, dayTripRoutes.id))
      .where(eq(dayTripStops.wineryId, winery.id)),
  ]);

  // Skip the first photo if it matches the hero image (avoid duplication)
  const galleryPhotos = photos.filter((p) => p.url !== winery.heroImageUrl);

  // Affiliate link for this winery's wines
  const affiliateUrl = wineryWinesUrl(winery.name);

  // Get more wineries in the same sub-region for cross-linking
  const moreInRegion = winery.subRegion
    ? await getMoreWineriesInRegion(winery.subRegion, winery.slug, 4)
    : [];

  // Build breadcrumb items
  const valleyPrefix = winery.valley === "napa" ? "/napa-valley" : winery.valley === "sonoma" ? "/sonoma-county" : null;
  const subRegionSlug = winery.subRegion
    ? await db
        .select({ slug: subRegions.slug })
        .from(subRegions)
        .where(eq(subRegions.name, winery.subRegion))
        .limit(1)
        .then((r) => r[0]?.slug)
    : null;

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    ...(valleyPrefix
      ? [{ name: winery.valley === "napa" ? "Napa Valley" : "Sonoma County", href: valleyPrefix }]
      : []),
    ...(valleyPrefix && subRegionSlug
      ? [{ name: winery.subRegion!, href: `${valleyPrefix}/${subRegionSlug}` }]
      : []),
    { name: winery.name, href: `/wineries/${winery.slug}` },
  ];

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Winery"],
    name: winery.name,
    description: winery.description || winery.shortDescription,
    url: `${BASE_URL}/wineries/${winery.slug}`,
    ...(winery.heroImageUrl && { image: winery.heroImageUrl }),
    ...(winery.phone && { telephone: winery.phone }),
    ...(winery.email && { email: winery.email }),
    ...(winery.websiteUrl && { sameAs: winery.websiteUrl }),
    address: {
      "@type": "PostalAddress",
      ...(winery.address && { streetAddress: winery.address }),
      ...(winery.city && { addressLocality: winery.city }),
      addressRegion: winery.state || "CA",
      ...(winery.zip && { postalCode: winery.zip }),
      addressCountry: "US",
    },
    ...(winery.lat &&
      winery.lng && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: winery.lat,
          longitude: winery.lng,
        },
      }),
    ...(winery.aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: winery.aggregateRating,
        bestRating: 5,
        ratingCount: winery.totalRatings || 1,
      },
    }),
    ...(winery.priceLevel && {
      priceRange: "$".repeat(winery.priceLevel),
    }),
    ...(tastings.length > 0 && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Tasting Experiences",
        itemListElement: tastings.slice(0, 5).map((t) => ({
          "@type": "Offer",
          name: t.name,
          ...(t.description && { description: t.description }),
          ...(t.price && {
            price: t.price,
            priceCurrency: "USD",
          }),
        })),
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
          <Link href="/" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          {valleyPrefix && (
            <>
              <Link href={valleyPrefix} className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                {winery.valley === "napa" ? "Napa Valley" : "Sonoma County"}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
          {valleyPrefix && subRegionSlug && (
            <>
              <Link href={`${valleyPrefix}/${subRegionSlug}`} className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                {winery.subRegion}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
          <span className="text-[var(--foreground)] font-medium truncate" aria-current="page">{winery.name}</span>
        </nav>
      </div>
      <WineryHero winery={winery} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!winery.curated && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            Last updated{" "}
            {new Date(winery.lastScrapedAt || winery.updatedAt || "2025-01-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
            {" "}Visit{" "}
            <a
              href={winery.websiteUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              {winery.name}&apos;s website
            </a>{" "}
            for the latest info on wines, prices, and hours.
          </div>
        )}
        {winery.curated && winery.curatedAt && (
          <p className="mb-4 text-xs text-[var(--muted-foreground)]">
            Last verified: {new Date(winery.curatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
          </p>
        )}
        <div className="mb-6 flex flex-wrap gap-3">
          <FavoriteButton wineryId={winery.id} />
          <WantToVisitButton wineryId={winery.id} />
          <VisitedButton wineryId={winery.id} />
          <AddToJournalButton wineryId={winery.id} wineryName={winery.name} />
          <AddToCollectionButton wineryId={winery.id} />
          <ShareButton title={winery.name} text={winery.shortDescription ?? undefined} />
        </div>

        {dayTrips.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {dayTrips.map((trip) => (
              <Link
                key={trip.slug}
                href={`/day-trips/${trip.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-burgundy-50 dark:bg-burgundy-950 border border-burgundy-200 dark:border-burgundy-800 px-3 py-1 text-xs font-medium text-burgundy-700 dark:text-burgundy-300 hover:bg-burgundy-100 dark:hover:bg-burgundy-900 transition-colors"
              >
                <Route className="h-3 w-3" />
                {trip.title}
              </Link>
            ))}
          </div>
        )}

        {/* About + Gallery (left) / Visit Info (right) */}
        <WineryInfoSection winery={winery} photos={galleryPhotos} />

        {/* Tasting Experiences — primary visitor content */}
        <div className="mt-8">
          <TastingTable tastings={tastings} curated={!!winery.curated} websiteUrl={winery.websiteUrl} phone={winery.phone} wineryId={winery.id} winerySlug={winery.slug} />
        </div>

        {/* Wines — secondary reference */}
        <div className="mt-8">
          <WineTable wines={wineryWines} curated={!!winery.curated} websiteUrl={winery.websiteUrl} phone={winery.phone} affiliateUrl={affiliateUrl} wineryId={winery.id} wineryName={winery.name} winerySlug={winery.slug} />
        </div>

        {/* Shop Wines Online (affiliate, only when env var set) */}
        {affiliateUrl && wineryWines.length > 0 && (
          <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="font-heading text-lg font-semibold mb-2">
              Shop {winery.name} Wines Online
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Can&apos;t visit in person? Browse and buy {winery.name} wines from trusted online retailers.
            </p>
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
            >
              Browse Wines Online
            </a>
          </div>
        )}

        {/* Hours — practical detail at bottom */}
        <HoursSection hoursJson={winery.hoursJson} />

        {/* Notes */}
        <div className="mt-8 max-w-xl">
          <NotesEditor wineryId={winery.id} />
        </div>
      </div>

      {/* More Wineries in Sub-Region */}
      {moreInRegion.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold">
                More Wineries in {winery.subRegion}
              </h2>
              {valleyPrefix && subRegionSlug && (
                <Link
                  href={`${valleyPrefix}/${subRegionSlug}`}
                  className="text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
                >
                  View all &rarr;
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {moreInRegion.map((w) => (
                <WineryCard key={w.slug} winery={w} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
