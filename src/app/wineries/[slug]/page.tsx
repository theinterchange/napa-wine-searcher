import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { wineries, subRegions, wines, wineTypes, tastingExperiences, wineryPhotos, dayTripRoutes, dayTripStops } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChevronRight, Check } from "lucide-react";
import { WineryHero } from "@/components/detail/WineryHero";
import { WineryDescription, WinerySidebar } from "@/components/detail/WineryInfoSection";
import { WineTable } from "@/components/detail/WineTable";
import { TastingTable } from "@/components/detail/TastingTable";
import { NotesEditor } from "@/components/detail/NotesEditor";
import { FavoriteButton } from "@/components/detail/FavoriteButton";
import { ShareButton } from "@/components/social/ShareButton";
import { VisitedButton } from "@/components/detail/VisitedButton";
import { AddToTripDetailButton } from "@/components/detail/AddToTripDetailButton";
import { UserWineryRating } from "@/components/detail/UserWineryRating";
import { ImpressionBeacon } from "@/components/analytics/ImpressionBeacon";
import { WineryCard } from "@/components/directory/WineryCard";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { FAQSection } from "@/components/region/FAQSection";
import { getMoreWineriesInRegion } from "@/lib/region-data";
import { getAccommodationsNearWinery } from "@/lib/accommodation-data";
import { NearbyAccommodations } from "@/components/accommodation/NearbyAccommodations";
import { wineryWinesUrl } from "@/lib/affiliate";
import { TrackedLink } from "@/components/monetization/TrackedLink";
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
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.slug, slug))
    .limit(1);

  if (!winery) return { title: "Winery Not Found" };

  const valleyLabel =
    winery.valley === "napa"
      ? "Napa Valley"
      : winery.valley === "sonoma"
        ? "Sonoma County"
        : null;
  const locationSuffix =
    winery.subRegion && valleyLabel
      ? `${winery.subRegion}, ${valleyLabel}`
      : valleyLabel || winery.city || "Wine Country";

  const title = `${winery.name} — ${locationSuffix} | Napa Sonoma Guide`;
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
      sustainableFarming: wineries.sustainableFarming,
      sustainableNote: wineries.sustainableNote,
      sustainableSource: wineries.sustainableSource,
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
      whyThisWinery: wineries.whyThisWinery,
      bestForTags: wineries.bestForTags,
      highlightTags: wineries.highlightTags,
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
        category: wineryPhotos.category,
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

  // Categorized photos for inline placement
  const settingPhoto = photos.find((p) => p.category === "setting");
  const tastingRoomPhoto = photos.find((p) => p.category === "tasting_room");

  // General booking URL for "Book with Winery" CTA: visit page → homepage
  const bookingUrl = winery.visitUrl || winery.websiteUrl;

  // Affiliate link for this winery's wines
  const affiliateUrl = wineryWinesUrl(winery.name);

  // Get more wineries in the same sub-region for cross-linking
  const [moreInRegion, nearbyAccommodations] = await Promise.all([
    winery.subRegion
      ? getMoreWineriesInRegion(winery.subRegion, winery.slug, 4)
      : Promise.resolve([]),
    getAccommodationsNearWinery(winery.id, 2),
  ]);

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
  // sameAs aggregates the official website + every external citation source
  // for the amenity claims (dog/kid/sustainable). AI crawlers and search
  // engines treat this array as the canonical citation list — surfacing
  // these makes the entity quotable in AI Overviews and rich results.
  const sameAsUrls = [
    winery.websiteUrl,
    winery.dogFriendlySource,
    winery.kidFriendlySource,
    winery.sustainableSource,
  ].filter((u): u is string => !!u && u.trim() !== "");
  // Dedupe — a producer's own visitor page is sometimes the source for
  // multiple amenities, no need to list it twice.
  const uniqueSameAs = Array.from(new Set(sameAsUrls));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Winery"],
    name: winery.name,
    description: winery.description || winery.shortDescription,
    url: `${BASE_URL}/wineries/${winery.slug}`,
    ...(winery.heroImageUrl && { image: winery.heroImageUrl }),
    ...(winery.phone && { telephone: winery.phone }),
    ...(winery.email && { email: winery.email }),
    ...(uniqueSameAs.length > 0 && { sameAs: uniqueSameAs }),
    // Top-level petsAllowed — Google reads this before amenityFeature
    ...(winery.dogFriendly != null && { petsAllowed: winery.dogFriendly }),
    // Audience signal for kid-friendly venues
    ...(winery.kidFriendly === true && {
      audience: { "@type": "Audience", audienceType: "Family" },
    }),
    // Freshness signal — when was the editorial data last verified
    ...(winery.curatedAt && { dateModified: winery.curatedAt }),
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
    ...((winery.dogFriendly || winery.kidFriendly || winery.picnicFriendly || winery.sustainableFarming) && {
      amenityFeature: [
        ...(winery.dogFriendly ? [{ "@type": "LocationFeatureSpecification", name: "Dog Friendly", value: true }] : []),
        ...(winery.kidFriendly ? [{ "@type": "LocationFeatureSpecification", name: "Kid Friendly", value: true }] : []),
        ...(winery.picnicFriendly ? [{ "@type": "LocationFeatureSpecification", name: "Picnic Area", value: true }] : []),
        ...(winery.sustainableFarming ? [{ "@type": "LocationFeatureSpecification", name: "Sustainable Farming", value: true }] : []),
      ],
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
      <ImpressionBeacon
        path={`/wineries/${winery.slug}`}
        pageType="winery"
        entityType="winery"
        entityId={winery.id}
        wineryId={winery.id}
      />

      {/* Breadcrumbs */}
      <div className="mx-auto max-w-5xl px-4 pt-2 pb-2 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]"
        >
          <Link
            href="/"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          {valleyPrefix && (
            <>
              <Link
                href={valleyPrefix}
                className="hover:text-[var(--foreground)] transition-colors"
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
                className="hover:text-[var(--foreground)] transition-colors"
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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content — LEFT */}
          <main className="lg:col-span-2 space-y-10">
            {/* Action buttons + tags */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="contents sm:hidden">
                  <FavoriteButton wineryId={winery.id} compact />
                  <ShareButton title={winery.name} text={winery.shortDescription ?? undefined} compact />
                  <VisitedButton wineryId={winery.id} compact />
                  <AddToTripDetailButton wineryId={winery.id} winerySlug={winery.slug} wineryName={winery.name} compact />
                </div>
                <div className="hidden sm:contents">
                  <FavoriteButton wineryId={winery.id} />
                  <ShareButton title={winery.name} text={winery.shortDescription ?? undefined} />
                  <VisitedButton wineryId={winery.id} />
                  <AddToTripDetailButton wineryId={winery.id} winerySlug={winery.slug} wineryName={winery.name} />
                </div>
              </div>

              {/* User rating */}
              <UserWineryRating wineryId={winery.id} wineryName={winery.name} />

              {/* Highlight tags */}
              {(() => {
                const tags: string[] = winery.highlightTags ? JSON.parse(winery.highlightTags) : [];
                return tags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[var(--muted-foreground)] shrink-0">Known for</span>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>

            {/* About — full description */}
            {winery.description && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  About {winery.name}
                </h2>
                <p className="text-base leading-relaxed text-[var(--muted-foreground)]">
                  {winery.description}
                </p>
              </section>
            )}

            {/* Why Visit + bullet reasons */}
            {(winery.whyVisit || winery.whyThisWinery) && (
              <section className="space-y-4">
                {winery.whyVisit && (
                  <>
                    <h2 className="font-heading text-2xl font-bold">
                      Why Visit {winery.name}
                    </h2>
                    <p className="text-base leading-relaxed text-[var(--muted-foreground)]">
                      {winery.whyVisit}
                    </p>
                  </>
                )}
                {(() => {
                  const reasons: string[] = winery.whyThisWinery ? JSON.parse(winery.whyThisWinery) : [];
                  return reasons.length > 0 ? (
                    <ul className="space-y-2">
                      {reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-[var(--muted-foreground)]">
                            {reason}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null;
                })()}
              </section>
            )}

            {/* The Setting */}
            {winery.theSetting && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  The Setting
                </h2>
                {settingPhoto && (
                  <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-6">
                    <Image
                      src={settingPhoto.blobUrl || settingPhoto.url}
                      alt={settingPhoto.altText || `${winery.name} setting`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                  </div>
                )}
                <p className="text-base leading-relaxed text-[var(--muted-foreground)]">
                  {winery.theSetting}
                </p>
              </section>
            )}

            {/* The Tasting Experience */}
            {winery.tastingRoomVibe && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  The Tasting Experience
                </h2>
                {tastingRoomPhoto && (
                  <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-6">
                    <Image
                      src={tastingRoomPhoto.blobUrl || tastingRoomPhoto.url}
                      alt={tastingRoomPhoto.altText || `${winery.name} tasting room`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                  </div>
                )}
                <p className="text-base leading-relaxed text-[var(--muted-foreground)]">
                  {winery.tastingRoomVibe}
                </p>
              </section>
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
                <TrackedLink
                  href={affiliateUrl}
                  clickType="buy_wine"
                  wineryId={winery.id}
                  sourcePage={`/wineries/${winery.slug}`}
                  sourceComponent="WineryDetail.ShopWines"
                  className="inline-flex items-center gap-2 rounded-lg bg-burgundy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
                >
                  Browse Wines Online
                </TrackedLink>
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

      {/* FAQ Section — generated from verified data */}
      {(() => {
        const faqs: { question: string; answer: string }[] = [];
        const valleyName =
          winery.valley === "napa"
            ? "Napa Valley"
            : winery.valley === "sonoma"
              ? "Sonoma County"
              : null;

        const websiteNote = winery.websiteUrl
          ? ` We recommend checking ${winery.name}'s website directly before visiting to confirm current policies.`
          : " We recommend contacting the winery directly before visiting to confirm current policies.";

        // Reservation
        faqs.push({
          question: `Do I need a reservation to visit ${winery.name}?`,
          answer: winery.reservationRequired
            ? `Yes, reservations are required at ${winery.name}. We recommend booking ahead, especially on weekends and during peak season (August\u2013October).${websiteNote}`
            : `${winery.name} accepts walk-in visitors, though reservations are recommended on weekends and during busy seasons.${websiteNote}`,
        });

        // Tasting cost — only if we have tasting data
        const tastingPrices = tastings
          .map((t) => t.price)
          .filter((p): p is number => p != null && p > 0);
        if (tastingPrices.length > 0) {
          const minPrice = Math.min(...tastingPrices);
          const maxPrice = Math.max(...tastingPrices);
          const priceNote = " Prices are subject to change \u2014 verify current pricing with the winery before visiting.";
          faqs.push({
            question: `How much does a tasting cost at ${winery.name}?`,
            answer:
              minPrice === maxPrice
                ? `Tastings start at $${minPrice} per person.${priceNote}`
                : `Tastings range from $${minPrice} to $${maxPrice} per person. ${winery.name} offers ${tastings.length} tasting experience${tastings.length > 1 ? "s" : ""}.${priceNote}`,
          });
        }

        // Dog-friendly
        if (winery.dogFriendly) {
          const dogConfident = winery.dogFriendlySource;
          faqs.push({
            question: `Is ${winery.name} dog-friendly?`,
            answer: winery.dogFriendlyNote
              ? `Yes. ${winery.dogFriendlyNote}${!dogConfident ? " Policies may change, so please confirm with the winery before bringing your pet." : ""}`
              : `Based on our research, ${winery.name} welcomes well-behaved dogs. Pet policies can change seasonally, so we recommend confirming directly with the winery before your visit.`,
          });
        } else {
          faqs.push({
            question: `Is ${winery.name} dog-friendly?`,
            answer: `Based on our information, ${winery.name} does not allow dogs. If this is important to your visit, contact the winery to confirm their current policy or consider nearby dog-friendly wineries in ${winery.subRegion || valleyName || "the area"}.`,
          });
        }

        // Kid-friendly
        if (winery.kidFriendly) {
          const kidConfidence = winery.kidFriendlyConfidence;
          faqs.push({
            question: `Is ${winery.name} kid-friendly?`,
            answer: kidConfidence === "medium"
              ? `${winery.name} may accommodate families, but we recommend confirming their children's policy directly before visiting.${winery.kidFriendlyNote ? ` ${winery.kidFriendlyNote.charAt(0).toUpperCase() + winery.kidFriendlyNote.slice(1)}.` : ""}`
              : winery.kidFriendlyNote
                ? `Yes. ${winery.kidFriendlyNote} Policies may vary, so it's always a good idea to check with the winery when planning a family visit.`
                : `Yes, ${winery.name} is family-friendly. We recommend contacting the winery for specific details on their children's policy.`,
          });
        } else {
          faqs.push({
            question: `Can I bring kids to ${winery.name}?`,
            answer: `Based on our information, ${winery.name} is geared toward adult guests (21+). If you're visiting with family, we suggest contacting the winery directly to discuss options.`,
          });
        }

        // Sustainable farming
        if (winery.sustainableFarming) {
          faqs.push({
            question: `Is ${winery.name} a sustainable winery?`,
            answer: winery.sustainableNote
              ? `Yes, ${winery.name} practices sustainable farming. ${winery.sustainableNote}.`
              : `Yes, ${winery.name} is committed to sustainable farming practices. Contact the winery for details on their environmental initiatives.`,
          });
        }

        // Location
        if (winery.address && winery.city) {
          faqs.push({
            question: `Where is ${winery.name} located?`,
            answer: `${winery.name} is located at ${winery.address}, ${winery.city}${winery.subRegion ? `, in the ${winery.subRegion} sub-region of ${valleyName}` : ""}. We recommend using the address for GPS navigation, as some wine country roads can be tricky.`,
          });
        }

        // Hours
        if (winery.hoursJson) {
          try {
            const hours = JSON.parse(winery.hoursJson);
            const hasHours = Object.values(hours).some(
              (v) => v && v !== "Closed"
            );
            if (hasHours) {
              const sample = hours.mon || hours.tue || hours.sat;
              faqs.push({
                question: `What are the hours at ${winery.name}?`,
                answer: sample
                  ? `${winery.name} is typically open ${sample}. Hours may vary by day and season, and wineries sometimes close for private events or holidays. Always confirm hours directly with the winery before making the trip.`
                  : `Hours vary by day and season. We recommend confirming hours directly with ${winery.name} before visiting.`,
              });
            }
          } catch {}
        }

        return faqs.length > 0 ? (
          <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-semibold mb-6">
              Frequently Asked Questions
            </h2>
            <FAQSection faqs={faqs} />
            <FAQSchema faqs={faqs} />
          </section>
        ) : null;
      })()}

      {/* Stay Nearby — placed before "More Wineries" so hotel options appear
          before the winery exit ramp (the only active monetization is the
          hotel affiliate, so it needs to come first in the after-content stack). */}
      {nearbyAccommodations.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <NearbyAccommodations
              accommodations={nearbyAccommodations}
              title="Where to Stay Nearby"
              valley={winery.valley === "napa" ? "napa" : winery.valley === "sonoma" ? "sonoma" : undefined}
            />
          </div>
        </section>
      )}

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
                  className="text-sm font-medium text-[var(--foreground)] hover:underline"
                >
                  View all &rarr;
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {moreInRegion.map((w) => (
                <WineryCard key={w.slug} winery={w} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Guides */}
      {(() => {
        const valleySlug = winery.valley === "napa" ? "napa-valley" : "sonoma-county";
        const guides: { label: string; href: string }[] = [];

        if (winery.dogFriendly) guides.push({ label: "Dog-Friendly Wineries", href: `/dog-friendly-wineries/${valleySlug}` });
        if (winery.kidFriendly) guides.push({ label: "Kid-Friendly Wineries", href: `/kid-friendly-wineries/${valleySlug}` });
        if (winery.picnicFriendly) guides.push({ label: "Picnic-Friendly Wineries", href: `/guides/picnic-wineries-${valleySlug}` });
        if (winery.sustainableFarming) guides.push({ label: "Sustainable Wineries", href: `/sustainable-wineries/${valleySlug}` });
        if (winery.priceLevel && winery.priceLevel <= 2) guides.push({ label: "Budget-Friendly Tastings", href: `/guides/cheap-wine-tastings-${valleySlug}` });
        if (winery.priceLevel && winery.priceLevel >= 4) guides.push({ label: "Luxury Tastings", href: `/guides/luxury-wine-tastings-${valleySlug}` });
        if (!winery.reservationRequired) guides.push({ label: "Walk-In Wineries", href: `/guides/walk-in-wineries-${valleySlug}` });
        guides.push({ label: `${winery.valley === "napa" ? "Napa Valley" : "Sonoma County"} Guide`, href: `/${valleySlug}` });

        if (guides.length === 0) return null;

        return (
          <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
              <h3 className="font-heading text-lg font-semibold mb-4">
                Related Guides
              </h3>
              <div className="flex flex-wrap gap-2">
                {guides.map((g) => (
                  <Link
                    key={g.href}
                    href={g.href}
                    className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                  >
                    {g.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

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
              href="/itineraries"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Browse Itineraries
            </Link>
            <Link
              href="/where-to-stay"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Where to Stay
            </Link>
            <Link
              href="/itineraries"
              className="rounded-lg bg-burgundy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
            >
              Plan Your Trip
            </Link>
          </div>
        </div>
      </section>

    </>
  );
}
