import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { accommodations, subRegions } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 86400;

type CollectionConfig = {
  slug: string;
  title: string;
  h1: string;
  hook: string;
  // SQL filter — operates over `accommodations` columns
  filter: ReturnType<typeof sql>;
};

const COLLECTIONS: CollectionConfig[] = [
  {
    slug: "highly-rated",
    title: "Top-rated wine country hotels",
    h1: "Top-rated wine country hotels.",
    hook: "Hotels with a Google rating of 4.6 or higher across at least 50 reviews. The most consistently well-liked stays in Napa and Sonoma — sorted by review weight.",
    filter: sql`${accommodations.googleRating} >= 4.6 AND ${accommodations.googleReviewCount} >= 50`,
  },
  {
    slug: "with-spa",
    title: "Wine country hotels with spas",
    h1: "Hotels with a spa.",
    hook: "Stays with full-service on-site spas — mineral baths, vineyard-view treatment rooms, and post-tasting recovery options across Napa and Sonoma.",
    filter: sql`${accommodations.spaJson} IS NOT NULL AND ${accommodations.spaJson} != '' AND ${accommodations.spaJson} != '[]'`,
  },
  {
    slug: "inns",
    title: "Napa & Sonoma boutique inns",
    h1: "Boutique inns.",
    hook: "Independent inns and small boutique stays — most have under 30 rooms, all have personality. Often the most charming and walkable bases for wine country.",
    filter: sql`${accommodations.type} = 'inn'`,
  },
  {
    slug: "resorts",
    title: "Napa & Sonoma wine country resorts",
    h1: "Wine country resorts.",
    hook: "Full-service resorts with restaurants, pools, spas, and grounds you don't want to leave. The complete-experience option for a longer wine country stay.",
    filter: sql`${accommodations.type} = 'resort'`,
  },
];

const COLLECTION_BY_SLUG = new Map(COLLECTIONS.map((c) => [c.slug, c]));

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ type: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const cfg = COLLECTION_BY_SLUG.get(type);
  if (!cfg) return { title: "Collection Not Found" };

  const count = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(accommodations)
    .where(cfg.filter);
  const n = count[0]?.count ?? 0;

  const title = `${cfg.title} — ${n} picks across Napa & Sonoma`;
  const description = `${n} ${cfg.title.toLowerCase()} across Napa Valley and Sonoma County. Sorted by guest rating, with direct booking links.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/where-to-stay/collections/${cfg.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/where-to-stay/collections/${cfg.slug}`,
      siteName: "Napa Sonoma Guide",
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const cfg = COLLECTION_BY_SLUG.get(type);
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
    .where(cfg.filter)
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
    valley: r.valley ?? "napa",
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

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: cfg.title,
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

  const otherCollections = COLLECTIONS.filter((c) => c.slug !== cfg.slug);

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
          { name: cfg.title, href: `/where-to-stay/collections/${cfg.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-3)] mb-4">
            <Link href="/where-to-stay" className="hover:text-[var(--brass-2)]">Where to Stay</Link>
          </nav>
          <span className="kicker">{cards.length} Hotels</span>
          <h1 className="font-[var(--font-heading)] text-[34px] sm:text-[44px] lg:text-[52px] font-normal tracking-[-0.01em] leading-[1.05] text-[var(--ink)] mt-2">
            <em>{cfg.h1}</em>
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
            {cards.map((a, i) => (
              <AccommodationCard
                key={a.slug}
                accommodation={a}
                showBookingCTA
                sourceComponent={`Collection_${cfg.slug}`}
                priority={i === 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Related collections */}
      <section className="border-t border-[var(--rule-soft)] bg-[var(--paper-tint)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="font-[var(--font-heading)] text-[22px] sm:text-[26px] font-normal tracking-[-0.01em] text-[var(--ink)] mb-4">
            Other ways to browse
          </h2>
          <ul className="font-[var(--font-serif-text)] text-[16px] leading-[1.8] text-[var(--ink-2)]">
            {otherCollections.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/where-to-stay/collections/${c.slug}`}
                  className="underline underline-offset-2 hover:text-[var(--brass-2)]"
                >
                  {c.title}
                </Link>
              </li>
            ))}
            <li className="mt-3">
              <Link href="/where-to-stay" className="underline underline-offset-2 hover:text-[var(--brass-2)]">
                All wine country accommodations
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
