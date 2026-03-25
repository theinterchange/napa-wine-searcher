import Link from "next/link";
import { db } from "@/db";
import { wineries, subRegions, wines, wineTypes, tastingExperiences, wineryPhotos, dayTripRoutes, dayTripStops } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { WineryHero } from "@/components/detail/WineryHero";
import { WineryDescription, WinerySidebar } from "@/components/detail/WineryInfoSection";
import { WineTable } from "@/components/detail/WineTable";
import { TastingTable } from "@/components/detail/TastingTable";
import { NotesEditor } from "@/components/detail/NotesEditor";
import { FavoriteButton } from "@/components/detail/FavoriteButton";
import { ShareButton } from "@/components/social/ShareButton";
import { VisitedButton } from "@/components/detail/VisitedButton";
import { AddToCompareButton } from "@/components/compare/AddToCompareButton";
import { WineryCard } from "@/components/directory/WineryCard";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { getMoreWineriesInRegion } from "@/lib/region-data";
import { wineryWinesUrl } from "@/lib/affiliate";
import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export async function generateStaticParams() {
  const all = await db.select({ slug: wineries.slug }).from(wineries);
  return all.map((w) => ({ slug: w.slug }));
}

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
      whyVisit: wineries.whyVisit,
      heroImageUrl: wineries.heroImageUrl,
      city: wineries.city,
    })
    .from(wineries)
    .where(eq(wineries.slug, slug))
    .limit(1);

  if (!winery) return { title: "Winery Not Found" };

  const title = `${winery.name} | Napa Sonoma Guide`;
  const ogTitle = winery.name;
  const description =
    winery.whyVisit || winery.shortDescription || `Visit ${winery.name} in wine country`;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: `${BASE_URL}/wineries/${slug}`,
      siteName: "Napa Sonoma Guide",
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
      visitUrl: wineries.visitUrl,
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
      whyVisit: wineries.whyVisit,
      theSetting: wineries.theSetting,
      visitorTips: wineries.visitorTips,
      knownFor: wineries.knownFor,
      tastingRoomVibe: wineries.tastingRoomVibe,
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
        blobUrl: wineryPhotos.blobUrl,
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

  // Prefer Blob URLs and skip the hero image to avoid duplication
  const galleryPhotos = photos
    .map((p) => ({ ...p, url: p.blobUrl || p.url }))
    .filter((p) => p.url !== winery.heroImageUrl);

  // Best booking URL: tasting sourceUrl → winery visitUrl → winery homepage
  const bookingUrl =
    tastings.find((t) => t.sourceUrl?.startsWith("http"))?.sourceUrl ||
    winery.visitUrl ||
    winery.websiteUrl;

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
      <div className="mx-auto max-w-5xl px-4 pt-2 pb-2 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]"
        >
          <Link
            href="/"
            className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          {valleyPrefix && (
            <>
              <Link
                href={valleyPrefix}
                className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
              >
                {winery.valley === "napa" ? "Napa Valley" : "Sonoma County"}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
          {valleyPrefix && subRegionSlug && (
            <>
              <Link
                href={`${valleyPrefix}/${subRegionSlug}`}
                className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
              >
                {winery.subRegion}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
          <span
            className="text-[var(--foreground)] font-medium truncate"
            aria-current="page"
          >
            {winery.name}
          </span>
        </nav>
      </div>

      {/* Hero with photo carousel */}
      <WineryHero winery={winery} photos={galleryPhotos} />

      {/* Two-column content */}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content — LEFT */}
          <main className="lg:col-span-2 space-y-16">
            {/* About heading + action buttons + Known For + editorial content */}
            <div>
              <h2 className="font-heading text-2xl font-bold mb-4">
                About {winery.name}
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="contents sm:hidden">
                  <FavoriteButton wineryId={winery.id} compact />
                  <ShareButton title={winery.name} text={winery.shortDescription ?? undefined} compact />
                  <VisitedButton wineryId={winery.id} compact />
                  <AddToCompareButton wineryId={winery.id} wineryName={winery.name} compact />
                </div>
                <div className="hidden sm:contents">
                  <FavoriteButton wineryId={winery.id} />
                  <ShareButton title={winery.name} text={winery.shortDescription ?? undefined} />
                  <VisitedButton wineryId={winery.id} />
                  <AddToCompareButton wineryId={winery.id} wineryName={winery.name} />
                </div>
              </div>
              {winery.knownFor && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">Known for</span>
                  {winery.knownFor.split(",").map((item) => (
                    <span
                      key={item.trim()}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]"
                    >
                      {item.trim()}
                    </span>
                  ))}
                </div>
              )}
              {winery.whyVisit && (
                <p className="text-base leading-relaxed text-[var(--muted-foreground)] mb-4">
                  {winery.whyVisit}
                </p>
              )}
              {winery.description && (
                <p className="text-base leading-relaxed text-[var(--muted-foreground)]">
                  {winery.description}
                </p>
              )}
              {winery.theSetting && (
                <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)]">
                  {winery.theSetting}
                </p>
              )}
            </div>

            {/* The Tasting Room */}
            {winery.tastingRoomVibe && (
              <div>
                <h3 className="font-heading text-xl font-bold mb-3">
                  The Tasting Room
                </h3>
                <p className="text-base leading-relaxed text-[var(--muted-foreground)]">
                  {winery.tastingRoomVibe}
                </p>
              </div>
            )}

            {/* Tasting Experiences */}
            <TastingTable
              tastings={[...tastings].sort((a, b) => (a.price ?? 999) - (b.price ?? 999))}
              curated={!!winery.curated}
              websiteUrl={bookingUrl}
              phone={winery.phone}
              wineryId={winery.id}
              winerySlug={winery.slug}
              wineryName={winery.name}
            />

            {/* Wines */}
            <WineTable
              wines={wineryWines}
              curated={!!winery.curated}
              websiteUrl={winery.websiteUrl}
              phone={winery.phone}
              affiliateUrl={affiliateUrl}
              wineryId={winery.id}
              wineryName={winery.name}
              winerySlug={winery.slug}
            />

            {/* Shop Wines affiliate */}
            {affiliateUrl && wineryWines.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <h3 className="font-heading text-lg font-semibold mb-2">
                  Shop {winery.name} Wines Online
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Can&apos;t visit in person? Browse and buy wines from trusted
                  online retailers.
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

            {/* Notes */}
            <div className="max-w-xl">
              <NotesEditor wineryId={winery.id} />
            </div>
          </main>

          {/* Sidebar — RIGHT */}
          <aside className="lg:col-span-1 border-t border-[var(--border)] pt-8 lg:border-t-0 lg:pt-0">
            <WinerySidebar winery={winery} dayTrips={dayTrips} />
          </aside>
        </div>
      </div>

      {/* More Wineries in Sub-Region */}
      {moreInRegion.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
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

      {/* Explore More */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h3 className="font-heading text-lg font-semibold mb-2">
            Planning a wine country trip?
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-5">
            Explore curated day trips and build your own custom route.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link
              href="/day-trips"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Browse Day Trips
            </Link>
            <Link
              href="/plan-trip"
              className="rounded-lg bg-burgundy-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
            >
              Plan Your Trip
            </Link>
          </div>
        </div>
      </section>

    </>
  );
}
