import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { accommodations, subRegions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 86400;

type CityConfig = {
  slug: string;
  city: string;
  valley: "napa" | "sonoma";
  valleyLabel: string;
  hook: string;
};

const CITY_CONFIGS: CityConfig[] = [
  {
    slug: "napa",
    city: "Napa",
    valley: "napa",
    valleyLabel: "Napa Valley",
    hook: "Downtown hotels walking distance to Oxbow Public Market, the Napa Valley Expo, and First Street restaurants. The most accessible base for visiting wineries across all sub-regions.",
  },
  {
    slug: "yountville",
    city: "Yountville",
    valley: "napa",
    valleyLabel: "Napa Valley",
    hook: "A walkable wine country town with Michelin-starred restaurants on every block. Boutique inns within steps of Bouchon Bakery, The French Laundry, and the Stags Leap District.",
  },
  {
    slug: "st-helena",
    city: "St Helena",
    valley: "napa",
    valleyLabel: "Napa Valley",
    hook: "Heart of the upper valley — luxury resorts, historic inns, and a boutique main street. Closest base to Rutherford, Oakville, and the legendary Highway 29 estates.",
  },
  {
    slug: "calistoga",
    city: "Calistoga",
    valley: "napa",
    valleyLabel: "Napa Valley",
    hook: "Hot springs, mineral pools, and a less polished, more relaxed feel than mid-valley. Resorts and cottages with mud baths, Indian Springs, and easy access to volcanic-soil wineries.",
  },
  {
    slug: "healdsburg",
    city: "Healdsburg",
    valley: "sonoma",
    valleyLabel: "Sonoma County",
    hook: "Sonoma's most polished town — a walkable plaza of restaurants, tasting rooms, and luxury hotels. The base for Dry Creek Valley, Russian River Valley, and Alexander Valley.",
  },
  {
    slug: "sonoma",
    city: "Sonoma",
    valley: "sonoma",
    valleyLabel: "Sonoma County",
    hook: "Historic plaza-side inns and resorts in the heart of Sonoma Valley. Walking distance to the mission, restaurants on the square, and a short drive to Glen Ellen and Carneros.",
  },
  {
    slug: "guerneville",
    city: "Guerneville",
    valley: "sonoma",
    valleyLabel: "Sonoma County",
    hook: "Russian River cabins, riverside lodges, and redwood-shaded retreats. The most casual, laid-back base in wine country — and the closest to the coast.",
  },
  {
    slug: "petaluma",
    city: "Petaluma",
    valley: "sonoma",
    valleyLabel: "Sonoma County",
    hook: "Historic Petaluma sits between Sonoma County and Marin — a quieter, more affordable base for day trips into both Sonoma and southern Napa.",
  },
];

const CITY_BY_SLUG = new Map(CITY_CONFIGS.map((c) => [c.slug, c]));

export function generateStaticParams() {
  return CITY_CONFIGS.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cfg = CITY_BY_SLUG.get(city);
  if (!cfg) return { title: "City Not Found" };

  const count = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(accommodations)
    .where(eq(accommodations.city, cfg.city));
  const n = count[0]?.count ?? 0;

  const title = `Hotels in ${cfg.city} — ${n} picks for ${cfg.valleyLabel}`;
  const description = `${n} hotels and inns in ${cfg.city}, ${cfg.valleyLabel}. Walking distance, drive times, and direct booking — sorted by guest rating.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/where-to-stay/cities/${cfg.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/where-to-stay/cities/${cfg.slug}`,
      siteName: "Napa Sonoma Guide",
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function CityHotelsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const cfg = CITY_BY_SLUG.get(city);
  if (!cfg) notFound();

  const rows = await db
    .select({
      slug: accommodations.slug,
      name: accommodations.name,
      type: accommodations.type,
      shortDescription: accommodations.shortDescription,
      city: accommodations.city,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: accommodations.valley,
      priceTier: accommodations.priceTier,
      starRating: accommodations.starRating,
      heroImageUrl: accommodations.heroImageUrl,
      thumbnailUrl: accommodations.thumbnailUrl,
      bestFor: accommodations.bestFor,
      bestForTags: accommodations.bestForTags,
      googleRating: accommodations.googleRating,
      googleReviewCount: accommodations.googleReviewCount,
      dogFriendly: accommodations.dogFriendly,
      dogFriendlyNote: accommodations.dogFriendlyNote,
      kidFriendly: accommodations.kidFriendly,
      kidFriendlyNote: accommodations.kidFriendlyNote,
      adultsOnly: accommodations.adultsOnly,
      bookingUrl: accommodations.bookingUrl,
      websiteUrl: accommodations.websiteUrl,
      lat: accommodations.lat,
      lng: accommodations.lng,
    })
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(and(eq(accommodations.city, cfg.city), eq(accommodations.valley, cfg.valley)))
    .orderBy(
      sql`${accommodations.googleRating} DESC NULLS LAST`,
      sql`${accommodations.googleReviewCount} DESC NULLS LAST`
    );

  if (rows.length === 0) notFound();

  const cards: AccommodationCardData[] = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    type: r.type,
    shortDescription: r.shortDescription,
    city: r.city,
    subRegion: r.subRegion,
    subRegionSlug: r.subRegionSlug,
    valley: r.valley ?? cfg.valley,
    priceTier: r.priceTier,
    starRating: r.starRating,
    heroImageUrl: r.heroImageUrl,
    thumbnailUrl: r.thumbnailUrl,
    bestFor: r.bestFor,
    bestForTags: r.bestForTags,
    googleRating: r.googleRating,
    googleReviewCount: r.googleReviewCount,
    dogFriendly: r.dogFriendly,
    dogFriendlyNote: r.dogFriendlyNote,
    kidFriendly: r.kidFriendly,
    kidFriendlyNote: r.kidFriendlyNote,
    adultsOnly: r.adultsOnly,
    bookingUrl: r.bookingUrl,
    websiteUrl: r.websiteUrl,
    lat: r.lat,
    lng: r.lng,
  }));

  const valleyHref = cfg.valley === "napa" ? "/where-to-stay/napa-valley" : "/where-to-stay/sonoma-county";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Hotels in ${cfg.city}, ${cfg.valleyLabel}`,
    numberOfItems: cards.length,
    itemListElement: cards.slice(0, 20).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LodgingBusiness",
        name: a.name,
        url: `${BASE_URL}/where-to-stay/${a.slug}`,
        ...(a.city && {
          address: {
            "@type": "PostalAddress",
            addressLocality: a.city,
            addressRegion: "CA",
            addressCountry: "US",
          },
        }),
        ...(a.googleRating && a.googleReviewCount && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: a.googleRating,
            reviewCount: a.googleReviewCount,
          },
        }),
      },
    })),
  };

  const otherCities = CITY_CONFIGS.filter((c) => c.slug !== cfg.slug && c.valley === cfg.valley);

  return (
    <main className="bg-[var(--paper)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Where to Stay", href: "/where-to-stay" },
          { name: cfg.valleyLabel, href: valleyHref },
          { name: cfg.city, href: `/where-to-stay/cities/${cfg.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-3)] mb-4">
            <Link href="/where-to-stay" className="hover:text-[var(--brass-2)]">Where to Stay</Link>
            <span className="mx-2">/</span>
            <Link href={valleyHref} className="hover:text-[var(--brass-2)]">{cfg.valleyLabel}</Link>
          </nav>
          <span className="kicker">{cards.length} Hotels</span>
          <h1 className="font-[var(--font-heading)] text-[34px] sm:text-[44px] lg:text-[52px] font-normal tracking-[-0.01em] leading-[1.05] text-[var(--ink)] mt-2">
            Hotels in <em>{cfg.city}.</em>
          </h1>
          <p className="mt-5 font-[var(--font-serif-text)] text-[17px] leading-[1.6] text-[var(--ink-2)] max-w-3xl" style={{ textWrap: "pretty" }}>
            {cfg.hook}
          </p>
        </div>
      </section>

      {/* Hotel grid */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((a) => (
              <AccommodationCard
                key={a.slug}
                accommodation={a}
                showBookingCTA
                sourceComponent={`CityLanding_${cfg.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      {otherCities.length > 0 && (
        <section className="border-t border-[var(--rule-soft)] bg-[var(--paper-tint)]">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <h2 className="font-[var(--font-heading)] text-[22px] sm:text-[26px] font-normal tracking-[-0.01em] text-[var(--ink)] mb-4">
              Other {cfg.valleyLabel} cities
            </h2>
            <ul className="font-[var(--font-serif-text)] text-[16px] leading-[1.8] text-[var(--ink-2)]">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/where-to-stay/cities/${c.slug}`}
                    className="underline underline-offset-2 hover:text-[var(--brass-2)]"
                  >
                    Hotels in {c.city}
                  </Link>
                </li>
              ))}
              <li className="mt-3">
                <Link href={valleyHref} className="underline underline-offset-2 hover:text-[var(--brass-2)]">
                  Browse all {cfg.valleyLabel} accommodations
                </Link>
              </li>
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
