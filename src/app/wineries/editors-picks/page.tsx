import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 86400; // 24h — picks change rarely

export const metadata: Metadata = {
  title: "Editor's Picks — 8 Napa & Sonoma Wineries Worth the Trip",
  description:
    "Eight wineries we'd send a friend to first — Castello di Amorosa, Frog's Leap, Hall, Hamel, Iron Horse, Jordan, Stag's Leap Wine Cellars, and The Donum Estate. One rotates as our weekly homepage pick.",
  openGraph: {
    title: "Editor's Picks — 8 Napa & Sonoma Wineries Worth the Trip",
    description:
      "Eight wineries we'd send a friend to first — across Napa, Sonoma Valley, Carneros, Russian River, Alexander Valley, and Stags Leap.",
    url: `${BASE_URL}/wineries/editors-picks`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/wineries/editors-picks`,
  },
};

const VALLEY_LABEL: Record<string, string> = {
  napa: "Napa Valley",
  sonoma: "Sonoma County",
};

async function getEditorsPicks() {
  return db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      heroImageUrl: wineries.heroImageUrl,
      city: wineries.city,
      priceLevel: wineries.priceLevel,
      tastingPriceMin: wineries.tastingPriceMin,
      reservationRequired: wineries.reservationRequired,
      visitUrl: wineries.visitUrl,
      websiteUrl: wineries.websiteUrl,
      // Lead-paragraph fallback chain. spotlight_teaser is the optional
      // override; otherwise pull whyVisit (hand-rewritten with Sonnet 4.5
      // per the May 2026 prose regen), then shortDescription as last resort.
      spotlightTeaser: wineries.spotlightTeaser,
      whyVisit: wineries.whyVisit,
      shortDescription: wineries.shortDescription,
      editorsPickRank: wineries.editorsPickRank,
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(and(eq(wineries.editorsPick, true), isNotNull(wineries.editorsPickRank)))
    .orderBy(wineries.editorsPickRank);
}

function pickLead(p: {
  spotlightTeaser: string | null;
  whyVisit: string | null;
  shortDescription: string | null;
}): string | null {
  if (p.spotlightTeaser?.trim()) return p.spotlightTeaser.trim();
  // Guard against legacy rows where these fields are JSON arrays.
  if (p.whyVisit && !p.whyVisit.trim().startsWith("[")) return p.whyVisit.trim();
  if (p.shortDescription && !p.shortDescription.trim().startsWith("[")) {
    return p.shortDescription.trim();
  }
  return null;
}

function poursLabel(tastingPriceMin: number | null, priceLevel: number | null): string {
  if (tastingPriceMin != null) {
    if (tastingPriceMin === 0) return "Complimentary";
    return `From $${Math.round(tastingPriceMin)}`;
  }
  if (!priceLevel) return "Inquire";
  if (priceLevel === 1) return "Under $40";
  if (priceLevel === 2) return "$40–$75";
  if (priceLevel === 3) return "$75–$150";
  return "$150+";
}

export default async function EditorsPicksPage() {
  const picks = await getEditorsPicks();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Editor's Picks — Napa & Sonoma Wineries",
    description:
      "Eight Napa and Sonoma wineries hand-selected by the Napa Sonoma Guide editors as the strongest first-time visits across the region.",
    numberOfItems: picks.length,
    itemListElement: picks.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": ["LocalBusiness", "Winery"],
        name: p.name,
        url: `${BASE_URL}/wineries/${p.slug}`,
        ...(p.heroImageUrl && { image: p.heroImageUrl }),
        ...(p.subRegion && {
          address: {
            "@type": "PostalAddress",
            addressLocality: p.city ?? undefined,
            addressRegion: "CA",
            addressCountry: "US",
          },
        }),
      },
    })),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <header className="mb-8 sm:mb-12 pb-6 border-b border-[var(--rule)]">
        <span className="kicker inline-flex items-center gap-1.5">
          <BadgeCheck className="h-3.5 w-3.5 text-[var(--brass)]" />
          Editor&apos;s Picks
        </span>
        <h1 className="editorial-h2 text-[32px] sm:text-[46px] lg:text-[56px] mt-3 sm:mt-4">
          Eight wineries we&apos;d send a <em>friend to first.</em>
        </h1>
        <p
          className="mt-5 max-w-[60ch] text-[16px] sm:text-[18px] leading-[1.55] text-[var(--ink-2)]"
          style={{ fontFamily: "var(--font-serif-text)", textWrap: "pretty" }}
        >
          Of the 225+ wineries we&apos;ve cataloged across Napa Valley and Sonoma
          County, these are the eight that earn the badge — the rotating shortlist
          our editors send to friends planning a first trip. One is featured on
          the homepage each week; all eight are listed in order below.
        </p>
        <p className="mt-3 font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
          Selection criteria: distinctive setting · serious wine · the kind of
          visit that earns a story.
        </p>
      </header>

      <ol className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 sm:gap-y-16">
        {picks.map((p) => {
          const valleyLabel = p.valley ? VALLEY_LABEL[p.valley] : null;
          const detailHref = `/wineries/${p.slug}`;
          const bookHref = p.visitUrl ?? p.websiteUrl;

          return (
            <li key={p.id} className="group flex flex-col">
              <Link
                href={detailHref}
                className="relative block aspect-[16/10] overflow-hidden bg-[var(--paper-2)]"
              >
                {p.heroImageUrl ? (
                  <Image
                    src={p.heroImageUrl}
                    alt={p.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--ink-2)]" />
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-[var(--brass)] px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--paper)]">
                  <BadgeCheck className="h-3 w-3" />
                  N° {p.editorsPickRank}
                </span>
              </Link>

              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-mono text-[12px] tracking-[0.18em] text-[var(--brass)] tabular-nums shrink-0">
                  {String(p.editorsPickRank ?? 0).padStart(2, "0")}
                </span>
                <span className="kicker">
                  {[p.subRegion, valleyLabel].filter(Boolean).join(" · ")}
                </span>
              </div>

              <h2 className="editorial-h2 text-[24px] sm:text-[28px] mt-2">
                <Link
                  href={detailHref}
                  className="hover:text-[var(--color-burgundy-900)] transition-colors"
                >
                  {p.name}
                </Link>
              </h2>

              {(() => {
                const lead = pickLead(p);
                return lead ? (
                  <p
                    className="mt-3 font-[var(--font-serif-text)] text-[15.5px] leading-[1.55] text-[var(--ink-2)] line-clamp-4"
                    style={{ textWrap: "pretty" }}
                  >
                    {lead}
                  </p>
                ) : null;
              })()}

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 pt-4 border-t border-[var(--rule-soft)] text-[13px]">
                <div>
                  <dt className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                    Tastings
                  </dt>
                  <dd className="font-[var(--font-serif-text)] mt-1 text-[var(--ink)]">
                    {poursLabel(p.tastingPriceMin, p.priceLevel)}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                    Reservations
                  </dt>
                  <dd className="font-[var(--font-serif-text)] mt-1 text-[var(--ink)]">
                    {p.reservationRequired ? "Required" : "Walk-ins welcome"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={detailHref}
                  className="inline-flex items-center gap-2 border border-[var(--ink)] text-[var(--ink)] font-mono text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-2.5 hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
                >
                  Read the full profile →
                </Link>
                {bookHref && (
                  <a
                    href={bookHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[var(--brass)] text-[var(--paper)] font-mono text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-2.5 hover:bg-[#f0d894] hover:text-[var(--ink)] transition-colors"
                  >
                    Book a tasting →
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="mt-16 sm:mt-20 pt-8 border-t border-[var(--rule)]">
        <p
          className="max-w-[60ch] font-[var(--font-serif-text)] text-[15px] leading-[1.6] text-[var(--ink-2)]"
          style={{ textWrap: "pretty" }}
        >
          <strong className="not-italic text-[var(--ink)]">A note on selection.</strong>{" "}
          Editor&apos;s Picks are wineries we&apos;ve highlighted for editorial reasons —
          distinctive setting, considered wine, and the kind of visit that earns
          a story when you get home. The rotation refreshes as new contenders earn
          their slot. None of the wineries on this list have paid for placement.
        </p>
        <p className="mt-4 max-w-[60ch] font-[var(--font-serif-text)] text-[15px] leading-[1.6] text-[var(--ink-2)]">
          See the rest of the catalog in{" "}
          <Link href="/wineries" className="underline decoration-[var(--brass)] underline-offset-4 hover:text-[var(--ink)]">
            the full directory
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
