import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import {
  estimateSegment,
  formatDistance,
  formatDriveTime,
  haversineDistance,
} from "@/lib/geo";
import { BASE_URL } from "@/lib/constants";

const HOTELS_TO_SHOW = 10;

export const revalidate = 86400;

export async function generateStaticParams() {
  const all = await db
    .select({ slug: wineries.slug })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id));
  return all.map((w) => ({ winerySlug: w.slug }));
}

async function getWinery(slug: string) {
  const [w] = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
      lat: wineries.lat,
      lng: wineries.lng,
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.slug, slug))
    .limit(1);
  return w ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ winerySlug: string }>;
}): Promise<Metadata> {
  const { winerySlug } = await params;
  const winery = await getWinery(winerySlug);
  if (!winery) return { title: "Hotels Near Winery" };

  const valleyLabel =
    winery.valley === "napa" ? "Napa Valley" : winery.valley === "sonoma" ? "Sonoma County" : "Wine Country";
  const cityLabel = winery.city ? `${winery.city}, ${valleyLabel}` : valleyLabel;

  const title = `Hotels near ${winery.name} — Drive times from ${cityLabel}`;
  const description = `${HOTELS_TO_SHOW} hotels closest to ${winery.name} in ${cityLabel}. Drive times, distances, and direct booking links.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/near/${winery.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/near/${winery.slug}`,
      siteName: "Napa Sonoma Guide",
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function HotelsNearWineryPage({
  params,
}: {
  params: Promise<{ winerySlug: string }>;
}) {
  const { winerySlug } = await params;
  const winery = await getWinery(winerySlug);
  if (!winery || winery.lat == null || winery.lng == null) notFound();

  const valleyFilter: "napa" | "sonoma" | undefined =
    winery.valley === "napa" || winery.valley === "sonoma" ? winery.valley : undefined;

  const allAccommodations = await getAllAccommodations(valleyFilter);

  const ranked = allAccommodations
    .filter((a) => a.lat != null && a.lng != null)
    .map((a) => {
      const straight = haversineDistance(a.lat!, a.lng!, winery.lat!, winery.lng!);
      const { miles, minutes } = estimateSegment(straight);
      return { acc: a, miles, minutes };
    })
    .sort((x, y) => x.minutes - y.minutes)
    .slice(0, HOTELS_TO_SHOW);

  if (ranked.length === 0) notFound();

  const valleyLabel =
    winery.valley === "napa" ? "Napa Valley" : winery.valley === "sonoma" ? "Sonoma County" : "Wine Country";
  const valleyHref = winery.valley === "napa" ? "/where-to-stay/napa-valley" : winery.valley === "sonoma" ? "/where-to-stay/sonoma-county" : "/where-to-stay";
  const closestMin = Math.round(ranked[0].minutes);
  const farthestMin = Math.round(ranked[ranked.length - 1].minutes);

  // JSON-LD ItemList of LodgingBusiness
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Hotels near ${winery.name}`,
    numberOfItems: ranked.length,
    itemListElement: ranked.map(({ acc, miles, minutes }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LodgingBusiness",
        name: acc.name,
        url: `${BASE_URL}/where-to-stay/${acc.slug}`,
        ...(acc.city && {
          address: {
            "@type": "PostalAddress",
            addressLocality: acc.city,
            addressRegion: "CA",
            addressCountry: "US",
          },
        }),
        ...(acc.googleRating && acc.googleReviewCount && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: acc.googleRating,
            reviewCount: acc.googleReviewCount,
          },
        }),
        description: `~${formatDriveTime(minutes)} (${formatDistance(miles)}) drive to ${winery.name}.`,
      },
    })),
  };

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
          { name: `Hotels near ${winery.name}`, href: `/near/${winery.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-3)] mb-4">
            <Link href="/where-to-stay" className="hover:text-[var(--brass-2)]">Where to Stay</Link>
            <span className="mx-2">/</span>
            <Link href={valleyHref} className="hover:text-[var(--brass-2)]">{valleyLabel}</Link>
          </nav>
          <span className="kicker">Stay Nearby</span>
          <h1 className="font-[var(--font-heading)] text-[34px] sm:text-[44px] lg:text-[52px] font-normal tracking-[-0.01em] leading-[1.05] text-[var(--ink)] mt-2">
            Hotels near <em>{winery.name}.</em>
          </h1>
          <p className="mt-5 font-[var(--font-serif-text)] text-[17px] leading-[1.6] text-[var(--ink-2)] max-w-2xl" style={{ textWrap: "pretty" }}>
            The {ranked.length} closest hotels to{" "}
            <Link href={`/wineries/${winery.slug}`} className="underline underline-offset-2 hover:text-[var(--brass-2)]">
              {winery.name}
            </Link>
            {winery.city ? ` in ${winery.city}` : ""}, ordered by drive time. Closest is about{" "}
            {closestMin} minutes; farthest on this list is about {farthestMin} minutes.
          </p>
        </div>
      </section>

      {/* Hotel table */}
      <section>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="border-t-2 border-[var(--brass-2)] border-b border-[var(--rule)]">
            <table className="w-full">
              <thead>
                <tr className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass-2)] text-left">
                  <th className="px-2 py-3 font-semibold">Hotel</th>
                  <th className="px-2 py-3 font-semibold text-right">Drive</th>
                  <th className="px-2 py-3 font-semibold text-right hidden sm:table-cell">Distance</th>
                  <th className="px-2 py-3 font-semibold text-right">Book</th>
                </tr>
              </thead>
              <tbody className="font-[var(--font-serif-text)] text-[14.5px] sm:text-[15.5px]">
                {ranked.map(({ acc, miles, minutes }) => (
                  <tr key={acc.slug} className="border-t border-[var(--rule-soft)]">
                    <td className="px-2 py-3">
                      <Link
                        href={`/where-to-stay/${acc.slug}`}
                        className="text-[var(--ink)] hover:text-[var(--brass-2)] hover:underline decoration-[var(--brass)] underline-offset-4 transition-colors"
                      >
                        {acc.name}
                      </Link>
                      {acc.city && (
                        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)] mt-1">
                          {acc.city}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums text-[var(--ink-2)]">~{formatDriveTime(minutes)}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-[var(--ink-2)] hidden sm:table-cell">{formatDistance(miles)}</td>
                    <td className="px-2 py-3 text-right">
                      <BookHotelCTA
                        bookingUrl={acc.bookingUrl}
                        websiteUrl={acc.websiteUrl}
                        accommodationName={acc.name}
                        lat={acc.lat}
                        lng={acc.lng}
                        accommodationId={undefined}
                        accommodationSlug={acc.slug}
                        sourcePage={`/near/${winery.slug}`}
                        sourceComponent="near_winery_landing"
                        size="sm"
                        label="Book"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 font-[var(--font-serif-text)] text-[12.5px] text-[var(--ink-3)]">
            Estimates based on straight-line distance with a wine-country routing factor. Actual drive times vary with traffic and route choice.
          </p>
        </div>
      </section>

      {/* Related links */}
      <section className="border-t border-[var(--rule-soft)] bg-[var(--paper-tint)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="font-[var(--font-heading)] text-[22px] sm:text-[26px] font-normal tracking-[-0.01em] text-[var(--ink)] mb-4">
            Plan your visit
          </h2>
          <ul className="font-[var(--font-serif-text)] text-[16px] leading-[1.8] text-[var(--ink-2)] space-y-2">
            <li>
              <Link href={`/wineries/${winery.slug}`} className="underline underline-offset-2 hover:text-[var(--brass-2)]">
                Visit {winery.name}
              </Link>
              {" "} — hours, tastings, and what to expect
            </li>
            <li>
              <Link href={valleyHref} className="underline underline-offset-2 hover:text-[var(--brass-2)]">
                Browse all {valleyLabel} accommodations
              </Link>
            </li>
            <li>
              <Link href="/plan-trip" className="underline underline-offset-2 hover:text-[var(--brass-2)]">
                Build a custom wine country itinerary
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
