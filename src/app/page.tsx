import type { Metadata } from "next";
import Link from "next/link";
import { Wine, Route, Dog, DollarSign, Sparkles, BedDouble } from "lucide-react";
import { db } from "@/db";
import { BASE_URL } from "@/lib/constants";
import { wineries, subRegions, accommodations } from "@/db/schema";
import { sql, count, eq, and, isNotNull } from "drizzle-orm";
import { HeroFeatured } from "@/components/home/HeroFeatured";
import { QuickFilterBar } from "@/components/home/QuickFilterBar";
import { EditorialInterlude } from "@/components/home/EditorialInterlude";
import { RegionCard } from "@/components/home/RegionCard";
import { GuideCard } from "@/components/home/GuideCard";
import { SeasonalBanner } from "@/components/home/SeasonalBanner";
import { HomepageSpotlight, type SpotlightWinery } from "@/components/home/HomepageSpotlight";
import {
  HomepageAccommodationSpotlight,
  type SpotlightAccommodation,
} from "@/components/home/HomepageAccommodationSpotlight";
import { getActiveSeasonalBanners } from "@/lib/seasonal";
import { wineryRankingDesc } from "@/lib/winery-ranking";
import { WineryCard } from "@/components/directory/WineryCard";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { BlogCard } from "@/components/blog/BlogCard";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { getAllPosts } from "@/lib/blog";
import { getGuideBySlug } from "@/lib/guide-content";
import { SUBREGION_CONTENT } from "@/lib/region-content";

export const revalidate = 86400; // ISR: regenerate daily

export const metadata: Metadata = {
  title: {
    absolute: "Napa Sonoma Guide — 225+ Wineries, Hotels & Wine Country Trips",
  },
  description:
    "Plan a Napa Valley or Sonoma County trip — 225+ vetted wineries, hand-picked hotels, day-trip routes, and tasting prices. Independent editorial, no marketing fluff.",
  openGraph: {
    title: "Napa Sonoma Guide — 225+ Wineries, Hotels & Wine Country Trips",
    description:
      "Plan a Napa Valley or Sonoma County trip — 225+ vetted wineries, hand-picked hotels, day-trip routes, and tasting prices.",
    url: BASE_URL,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

async function getFeaturedWineries() {
  const top = await db
    .select({
      slug: wineries.slug,
      name: wineries.name,
      heroImageUrl: wineries.heroImageUrl,
      subRegion: subRegions.name,
      valley: subRegions.valley,
      googleRating: wineries.googleRating,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.curated, true))
    .orderBy(wineryRankingDesc)
    .limit(10);

  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top[i], top[j]] = [top[j], top[i]];
  }
  return top.slice(0, 5);
}

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const SPOTLIGHT_WINERY_FIELDS = {
  id: wineries.id,
  slug: wineries.slug,
  name: wineries.name,
  shortDescription: wineries.shortDescription,
  heroImageUrl: wineries.heroImageUrl,
  websiteUrl: wineries.websiteUrl,
  visitUrl: wineries.visitUrl,
  reservationRequired: wineries.reservationRequired,
  priceLevel: wineries.priceLevel,
  whyVisit: wineries.whyVisit,
  whyThisWinery: wineries.whyThisWinery,
  knownFor: wineries.knownFor,
  subRegion: subRegions.name,
  valley: subRegions.valley,
  spotlightTeaser: wineries.spotlightTeaser,
} as const;

async function getSpotlightWinery(): Promise<SpotlightWinery | null> {
  // Step 1 — manual override: a winery explicitly assigned to the current month.
  const ym = currentYearMonth();
  const [override] = await db
    .select(SPOTLIGHT_WINERY_FIELDS)
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.spotlightYearMonth, ym))
    .limit(1);

  if (override) return override as SpotlightWinery;

  // Step 2 — auto-rotation fallback over curated pool.
  const candidates = await db
    .select(SPOTLIGHT_WINERY_FIELDS)
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(and(eq(wineries.curated, true), isNotNull(wineries.heroImageUrl)))
    .orderBy(wineryRankingDesc)
    .limit(20);

  if (candidates.length === 0) return null;
  const now = new Date();
  const monthIdx = now.getUTCMonth() + now.getUTCFullYear() * 12;
  return (candidates[monthIdx % candidates.length] ?? null) as SpotlightWinery | null;
}

const SPOTLIGHT_ACCOMMODATION_FIELDS = {
  id: accommodations.id,
  slug: accommodations.slug,
  name: accommodations.name,
  shortDescription: accommodations.shortDescription,
  heroImageUrl: accommodations.heroImageUrl,
  websiteUrl: accommodations.websiteUrl,
  bookingUrl: accommodations.bookingUrl,
  whyStayHere: accommodations.whyStayHere,
  theExperience: accommodations.theExperience,
  whyThisHotel: accommodations.whyThisHotel,
  type: accommodations.type,
  priceTier: accommodations.priceTier,
  starRating: accommodations.starRating,
  googleRating: accommodations.googleRating,
  lat: accommodations.lat,
  lng: accommodations.lng,
  valley: accommodations.valley,
  subRegion: subRegions.name,
  spotlightTeaser: accommodations.spotlightTeaser,
} as const;

async function getSpotlightAccommodation(): Promise<SpotlightAccommodation | null> {
  const ym = currentYearMonth();
  const [override] = await db
    .select(SPOTLIGHT_ACCOMMODATION_FIELDS)
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(eq(accommodations.spotlightYearMonth, ym))
    .limit(1);

  if (override) return override as SpotlightAccommodation;

  const candidates = await db
    .select(SPOTLIGHT_ACCOMMODATION_FIELDS)
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(
      and(eq(accommodations.curated, true), isNotNull(accommodations.heroImageUrl))
    )
    .limit(20);

  if (candidates.length === 0) return null;
  const now = new Date();
  const monthIdx = now.getUTCMonth() + now.getUTCFullYear() * 12;
  return (candidates[monthIdx % candidates.length] ?? null) as SpotlightAccommodation | null;
}

async function getPopularSubRegions() {
  const regions = await db
    .select({
      name: subRegions.name,
      slug: subRegions.slug,
      valley: subRegions.valley,
      count: count(),
    })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .groupBy(subRegions.id)
    .orderBy(sql`count(*) DESC`)
    .limit(8);

  const napaRegions = regions.filter((r) => r.valley === "napa").slice(0, 2);
  const sonomaRegions = regions.filter((r) => r.valley === "sonoma").slice(0, 2);
  const featured = [...napaRegions, ...sonomaRegions];

  const heroImages = await Promise.all(
    featured.map(async (region) => {
      const [topWinery] = await db
        .select({ heroImageUrl: wineries.heroImageUrl })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(
          and(
            eq(subRegions.slug, region.slug),
            eq(wineries.curated, true),
            isNotNull(wineries.heroImageUrl)
          )
        )
        .orderBy(wineryRankingDesc)
        .limit(1);
      return topWinery?.heroImageUrl ?? null;
    })
  );

  return featured.map((region, i) => ({
    ...region,
    heroImageUrl: heroImages[i],
  }));
}

async function getHomepageWineries() {
  return db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      shortDescription: wineries.shortDescription,
      city: wineries.city,
      priceLevel: wineries.priceLevel,
      aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings,
      reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly,
      picnicFriendly: wineries.picnicFriendly,
      kidFriendly: wineries.kidFriendly,
      kidFriendlyConfidence: wineries.kidFriendlyConfidence,
      tastingPriceMin: wineries.tastingPriceMin,
      heroImageUrl: wineries.heroImageUrl,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
      curated: wineries.curated,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .orderBy(wineryRankingDesc)
    .limit(9);
}

async function getGuideHeroFallbacks() {
  const [cabernet] = await db
    .select({ heroImageUrl: wineries.heroImageUrl })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(
      and(
        eq(wineries.curated, true),
        eq(subRegions.valley, "napa"),
        isNotNull(wineries.heroImageUrl)
      )
    )
    .orderBy(wineryRankingDesc)
    .limit(1);

  return {
    cabernet: cabernet?.heroImageUrl ?? null,
  };
}

function getHomepageGuides(fallbackImages: { cabernet: string | null }) {
  const guideConfigs = [
    {
      slug: "first-time-guide-napa-valley",
      label: "First Time in Napa Valley",
      icon: Sparkles,
      heroImage: "/images/blog/napa-first-time-hero.jpg",
    },
    {
      slug: "dog-friendly-wineries",
      label: "Dog-Friendly Wineries",
      icon: Dog,
      heroImage: "/images/blog/dog-friendly-wineries-hero.jpg",
      href: "/dog-friendly-wineries",
    },
    {
      slug: "cheap-wine-tastings-napa-valley",
      label: "Budget Tastings",
      icon: DollarSign,
      heroImage: "/images/blog/budget-wine-tasting-hero.jpg",
    },
    {
      slug: "best-cabernet-sauvignon-napa-valley",
      label: "Best Cabernet Sauvignon",
      icon: Wine,
      heroImage: fallbackImages.cabernet,
    },
  ];

  return guideConfigs.map((config) => {
    const guide = getGuideBySlug(config.slug);
    return {
      ...config,
      intro: guide?.intro?.[0] ?? "Browse the full set on napasonomaguide.com.",
    };
  });
}

export default async function HomePage() {
  const [
    featured,
    homepageWineries,
    popularRegions,
    allAccommodations,
    blogPosts,
    guideFallbacks,
    spotlight,
    spotlightAccommodation,
  ] = await Promise.all([
    getFeaturedWineries(),
    getHomepageWineries(),
    getPopularSubRegions(),
    getAllAccommodations(),
    Promise.resolve(getAllPosts().slice(0, 3)),
    getGuideHeroFallbacks(),
    getSpotlightWinery(),
    getSpotlightAccommodation(),
  ]);

  const topAccommodations = allAccommodations.slice(0, 6);
  const guides = getHomepageGuides(guideFallbacks);

  const enrichedRegions = popularRegions.map((region) => {
    const content = SUBREGION_CONTENT[region.slug];
    return {
      ...region,
      signatureVarietal: content?.signatureVarietal ?? "Wine Country",
      whyVisit:
        content?.whyVisit ??
        content?.description?.[0] ??
        `Discover ${region.count} wineries in ${region.name}.`,
    };
  });

  const seasonalBanners = getActiveSeasonalBanners();

  return (
    <>
      {/* Hero — magazine-cover w/ rotating featured wineries (contains H1) */}
      <HeroFeatured wineries={featured} />

      {/* Seasonal banners — auto-managed by start/end dates */}
      {seasonalBanners.map((banner) => (
        <SeasonalBanner key={banner.id} banner={banner} />
      ))}

      {/* N° 01 / Wineries — directory */}
      <section className="py-6 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-head">
            <span className="num">N° 01 / Wineries</span>
            <h2>
              Browse the <em>directory.</em>
            </h2>
            <p className="lede hidden sm:block">
              Hand-picked — iconic estates and tucked-away gems alike.
            </p>
          </div>

          <QuickFilterBar />

          <div className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {homepageWineries.map((winery) => (
              <WineryCard key={winery.slug} winery={winery} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/wineries"
              className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] border-b border-[var(--brass)] pb-1 hover:text-[var(--brass-2)] transition-colors"
            >
              Browse every winery →
            </Link>
          </div>
        </div>
      </section>

      {/* N° 02 / Spotlight — featured estate (sponsorship-ready) */}
      <HomepageSpotlight winery={spotlight} />

      {/* N° 03 / Cartography — editorial map interlude */}
      <EditorialInterlude />

      {/* N° 04 / Regions */}
      {enrichedRegions.length > 0 && (() => {
        const napaRegions = enrichedRegions.filter((r) => r.valley === "napa");
        const sonomaRegions = enrichedRegions.filter((r) => r.valley === "sonoma");
        return (
          <section className="py-10 sm:py-12 lg:py-14 border-t border-[var(--rule-soft)]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="section-head">
                <span className="num">N° 04 / Regions</span>
                <h2>
                  Region by <em>region.</em>
                </h2>
              </div>

              {napaRegions.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <span className="kicker">Napa Valley</span>
                    <Link
                      href="/napa-valley"
                      className="font-mono text-[10px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] border-b border-[var(--brass)] pb-0.5 hover:text-[var(--brass-2)] transition-colors"
                    >
                      All Napa regions →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {napaRegions.map((region) => (
                      <RegionCard
                        key={region.slug}
                        name={region.name}
                        slug={region.slug}
                        valley="napa"
                        count={region.count}
                        signatureVarietal={region.signatureVarietal}
                        whyVisit={region.whyVisit}
                        heroImageUrl={region.heroImageUrl}
                      />
                    ))}
                  </div>
                </div>
              )}

              {sonomaRegions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="kicker">Sonoma County</span>
                    <Link
                      href="/sonoma-county"
                      className="font-mono text-[10px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] border-b border-[var(--brass)] pb-0.5 hover:text-[var(--brass-2)] transition-colors"
                    >
                      All Sonoma regions →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {sonomaRegions.map((region) => (
                      <RegionCard
                        key={region.slug}
                        name={region.name}
                        slug={region.slug}
                        valley="sonoma"
                        count={region.count}
                        signatureVarietal={region.signatureVarietal}
                        whyVisit={region.whyVisit}
                        heroImageUrl={region.heroImageUrl}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* N° 05 / Lodging — densified hotel grid */}
      <section className="py-10 sm:py-12 lg:py-14 border-t border-[var(--rule-soft)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-head">
            <span className="num">N° 05 / Lodging</span>
            <h2>
              Where to <em>stay.</em>
            </h2>
            <p className="lede">
              Farmhouse inns to vineyard cottages — pick a base.
            </p>
          </div>

          {spotlightAccommodation && (
            <div className="mt-10 mb-12">
              <HomepageAccommodationSpotlight
                accommodation={spotlightAccommodation}
              />
            </div>
          )}

          {topAccommodations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {topAccommodations.map((a) => (
                <AccommodationCard
                  key={a.slug}
                  accommodation={a}
                  showBookingCTA
                  sourceComponent="HomepageFeatured"
                />
              ))}
            </div>
          )}

          <div className="text-center mb-16">
            <Link
              href="/where-to-stay"
              className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] border-b border-[var(--brass)] pb-1 hover:text-[var(--brass-2)] transition-colors"
            >
              Compare every stay →
            </Link>
          </div>

          {/* Quick links — demoted footer band */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-[var(--rule-soft)]">
            <Link
              href="/wineries"
              className="group flex items-start gap-4 p-4 hover:bg-[var(--paper-2)] transition-colors"
            >
              <Wine className="h-5 w-5 text-[var(--brass)] shrink-0 mt-1" />
              <div>
                <span className="kicker">Quick link</span>
                <p className="font-[var(--font-heading)] text-[18px] font-normal tracking-[-0.005em] text-[var(--ink)] mt-1 group-hover:text-[var(--color-burgundy-900)] transition-colors">
                  Browse Wineries
                </p>
                <p className="font-[var(--font-serif-text)] text-[13px] text-[var(--ink-2)] mt-1">
                  Tastings, ratings, and the lay of the land
                </p>
              </div>
            </Link>
            <Link
              href="/where-to-stay"
              className="group flex items-start gap-4 p-4 hover:bg-[var(--paper-2)] transition-colors"
            >
              <BedDouble className="h-5 w-5 text-[var(--brass)] shrink-0 mt-1" />
              <div>
                <span className="kicker">Quick link</span>
                <p className="font-[var(--font-heading)] text-[18px] font-normal tracking-[-0.005em] text-[var(--ink)] mt-1 group-hover:text-[var(--color-burgundy-900)] transition-colors">
                  Where to Stay
                </p>
                <p className="font-[var(--font-serif-text)] text-[13px] text-[var(--ink-2)] mt-1">
                  Hand-picked hotels &amp; resorts
                </p>
              </div>
            </Link>
            <Link
              href="/itineraries"
              className="group flex items-start gap-4 p-4 hover:bg-[var(--paper-2)] transition-colors"
            >
              <Route className="h-5 w-5 text-[var(--brass)] shrink-0 mt-1" />
              <div>
                <span className="kicker">Quick link</span>
                <p className="font-[var(--font-heading)] text-[18px] font-normal tracking-[-0.005em] text-[var(--ink)] mt-1 group-hover:text-[var(--color-burgundy-900)] transition-colors">
                  Plan a Trip
                </p>
                <p className="font-[var(--font-serif-text)] text-[13px] text-[var(--ink-2)] mt-1">
                  Build your winery route
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* N° 06 / Guides */}
      <section className="py-10 sm:py-12 lg:py-14 border-t border-[var(--rule-soft)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-head">
            <span className="num">N° 06 / Guides</span>
            <h2>
              If you need <em>ideas.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {guides.map((g) => (
              <GuideCard
                key={g.slug}
                slug={g.slug}
                label={g.label}
                intro={g.intro}
                icon={g.icon}
                heroImage={g.heroImage}
                href={(g as { href?: string }).href}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/guides"
              className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] border-b border-[var(--brass)] pb-1 hover:text-[var(--brass-2)] transition-colors"
            >
              All guides →
            </Link>
          </div>
        </div>
      </section>

      {/* N° 07 / Dispatches — blog */}
      {blogPosts.length > 0 && (
        <section className="py-10 sm:py-12 lg:py-14 border-t border-[var(--rule-soft)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="section-head">
              <span className="num">N° 07 / Dispatches</span>
              <h2>
                From the <em>blog.</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] border-b border-[var(--brass)] pb-1 hover:text-[var(--brass-2)] transition-colors"
              >
                Read all dispatches →
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
