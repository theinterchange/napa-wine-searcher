/**
 * Layout for SEO category landing pages (dog-friendly, kid-friendly,
 * sustainable wineries — and eventually accommodations).
 *
 * Functional guide convention: hero image with title overlay, one-sentence
 * body lead, then the data (winery cards) immediately. Long-form regional
 * prose belongs on the region pages, not here.
 *
 * Server component — no client-side interactivity.
 */
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Wine, BookOpen, MapPin } from "lucide-react";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { FAQSection } from "@/components/region/FAQSection";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { CategoryWineryCard } from "@/components/category/CategoryWineryCard";
import { CategoryJsonLd } from "@/components/seo/CategoryJsonLd";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { BASE_URL } from "@/lib/constants";
import {
  displaySubRegionName,
  type CategoryHeroPick,
  type CategoryScope,
  type QualifyingSubregion,
  type WineryAmenity,
  type Valley,
} from "@/lib/category-data";
import {
  getCategoryFaqs,
  type CategoryMeta,
} from "@/lib/category-content";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";

interface CategoryLandingLayoutProps {
  amenity: WineryAmenity;
  scope: CategoryScope;
  meta: CategoryMeta;
  deck: string;
  hero: CategoryHeroPick | null;
  wineries: React.ComponentProps<typeof CategoryWineryCard>["winery"][];
  qualifyingSubregions: QualifyingSubregion[];
  nearbyAccommodations: AccommodationCardData[];
}

const VALLEY_LABEL: Record<Valley, string> = {
  napa: "Napa Valley",
  sonoma: "Sonoma County",
};

const CLUSTER_ROOT: Record<WineryAmenity, string> = {
  dog: "/dog-friendly-wineries",
  kid: "/kid-friendly-wineries",
  sustainable: "/sustainable-wineries",
};

const CLUSTER_LABEL: Record<WineryAmenity, string> = {
  dog: "Dog-Friendly Wineries",
  kid: "Kid-Friendly Wineries",
  sustainable: "Sustainable Wineries",
};

function buildBreadcrumb(
  amenity: WineryAmenity,
  scope: CategoryScope,
  qualifyingSubregions: QualifyingSubregion[]
) {
  const root = CLUSTER_ROOT[amenity];
  const items = [
    { name: "Home", href: "/" },
    { name: CLUSTER_LABEL[amenity], href: root },
  ];
  if (scope.kind === "valley") {
    items.push({
      name: VALLEY_LABEL[scope.valley],
      href: `${root}/${scope.valley === "napa" ? "napa-valley" : "sonoma-county"}`,
    });
  } else if (scope.kind === "subregion") {
    const sr = qualifyingSubregions.find((s) => s.slug === scope.subRegionSlug);
    if (sr) {
      items.push({
        name: VALLEY_LABEL[sr.valley],
        href: `${root}/${sr.valley === "napa" ? "napa-valley" : "sonoma-county"}`,
      });
      items.push({
        name: displaySubRegionName(sr.name),
        href: `${root}/${sr.slug}`,
      });
    }
  }
  return items;
}

export function CategoryLandingLayout({
  amenity,
  scope,
  meta,
  deck,
  hero,
  wineries,
  qualifyingSubregions,
  nearbyAccommodations,
}: CategoryLandingLayoutProps) {
  const root = CLUSTER_ROOT[amenity];
  const pageUrl = `${BASE_URL}${root}${meta.pathSegments.length ? "/" + meta.pathSegments.join("/") : ""}`;
  const breadcrumb = buildBreadcrumb(amenity, scope, qualifyingSubregions);
  const faqs = getCategoryFaqs(amenity);

  // Sibling spokes for the footer "nearby regions" — only on subregion pages
  const siblingSubregions =
    scope.kind === "subregion"
      ? qualifyingSubregions.filter((s) => s.slug !== scope.subRegionSlug)
      : [];

  return (
    <>
      <CategoryJsonLd
        amenity={amenity}
        pageUrl={pageUrl}
        pageName={meta.h1}
        pageDescription={meta.description}
        wineries={wineries}
      />
      <BreadcrumbSchema items={breadcrumb} />
      <FAQSchema faqs={faqs} />

      <article>
        {/* ── HERO ────────────────────────────────────────────────────── */}
        <div className="relative bg-[var(--ink)] text-white overflow-hidden">
          {hero ? (
            <>
              <Image
                src={hero.url}
                alt={`${hero.wineryName} — ${meta.h1}`}
                fill
                sizes="100vw"
                quality={85}
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)]/40 via-[var(--ink)]/55 to-[var(--ink)]/90" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)]/55 via-transparent to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-burgundy-800 via-burgundy-900 to-burgundy-950">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Wine className="h-48 w-48" />
              </div>
            </div>
          )}

          <div className="relative mx-auto max-w-5xl px-4 pt-24 sm:pt-32 lg:pt-44 pb-12 sm:pb-14 lg:pb-18 sm:px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase text-white/85 mb-6"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {breadcrumb.map((item, i) => (
                <span key={item.href} className="inline-flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
                  {i === breadcrumb.length - 1 ? (
                    <span className="text-[#f0d894]">{item.name}</span>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            <h1
              className="font-[var(--font-heading)] text-white text-[34px] sm:text-[44px] lg:text-[56px] leading-[1.05] tracking-[-0.015em] font-normal max-w-[22ch]"
              style={{ textWrap: "balance", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
            >
              {meta.h1}
            </h1>
          </div>

          {hero && (
            <div className="absolute bottom-3 right-4 sm:right-6 lg:right-8 z-10">
              <Link
                href={`/wineries/${hero.winerySlug}`}
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/60 hover:text-white/90 transition-colors"
              >
                Photo: {hero.wineryName} →
              </Link>
            </div>
          )}
        </div>

        {/* ── BODY LEAD ─────────────────────────────────────────────── */}
        {deck && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-18">
            <p
              className="drop-cap-editorial max-w-3xl font-[var(--font-serif-text)] text-[17px] leading-[1.7] text-[var(--ink-2)]"
              style={{ textWrap: "pretty" }}
            >
              {deck}
            </p>
          </div>
        )}

        {/* ── THE WINERIES ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-16">
          <div className="border-b border-[var(--rule)] pb-4 mb-8 flex items-baseline justify-between gap-4">
            <span className="kicker">The Wineries</span>
            <span className="font-[var(--font-serif-text)] text-[13px] text-[var(--ink-3)]">
              {wineries.length} {wineries.length === 1 ? "estate" : "estates"}
            </span>
          </div>
          {wineries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wineries.map((w) => (
                <CategoryWineryCard key={w.id} amenity={amenity} winery={w} />
              ))}
            </div>
          ) : (
            <p className="font-[var(--font-serif-text)] text-[var(--ink-3)]">
              No wineries currently match this filter.
            </p>
          )}
        </section>

        {/* ── MAKE IT A WEEKEND (revenue moment) ────────────────────── */}
        {nearbyAccommodations.length > 0 && (
          <section className="border-t border-[var(--rule-soft)] bg-[var(--paper-2)]/40">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
              <div className="border-b border-[var(--rule)] pb-4 mb-8 flex items-end justify-between gap-3">
                <div>
                  <span className="kicker">Make a Weekend</span>
                  <h2 className="editorial-h2 text-[28px] sm:text-[34px] mt-2">
                    Where to <em>stay.</em>
                  </h2>
                  <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-2xl" style={{ textWrap: "pretty" }}>
                    {amenity === "dog"
                      ? "Dog-friendly hotels, inns, and resorts within easy driving distance — the natural extension of an afternoon in tasting rooms."
                      : amenity === "kid"
                        ? "Family-welcoming places to stay within easy reach of these wineries."
                        : "Wine-country places to stay within easy reach of these wineries."}
                  </p>
                </div>
                <Link
                  href={amenity === "dog" ? "/dog-friendly-hotels" : "/where-to-stay"}
                  className="hidden sm:inline-flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--brass-2)] transition-colors"
                >
                  See all
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {nearbyAccommodations.map((a) => (
                  <AccommodationCard
                    key={a.slug}
                    accommodation={a}
                    sourceComponent="CategoryLandingLayoutV2"
                    showBookingCTA
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        {faqs.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="border-b border-[var(--rule)] pb-4 mb-2">
              <span className="kicker">FAQ</span>
              <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">
                Frequently <em>asked.</em>
              </h2>
            </div>
            <FAQSection faqs={faqs} />
          </section>
        )}

        {/* ── SIBLING SPOKES (subregion only) ───────────────────────── */}
        {siblingSubregions.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
            <span className="kicker">Nearby</span>
            <h2 className="editorial-h2 text-[24px] sm:text-[28px] mt-2 mb-5">
              Other {CLUSTER_LABEL[amenity].toLowerCase()} <em>nearby.</em>
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblingSubregions.map((sr) => (
                <Link
                  key={sr.slug}
                  href={`${root}/${sr.slug}`}
                  className="inline-flex items-center gap-1.5 border border-[var(--rule)] bg-[var(--paper)] px-3 py-1.5 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:border-[var(--brass)] hover:text-[var(--ink)] transition-colors"
                >
                  <MapPin className="h-3 w-3 text-[var(--brass)]" />
                  {displaySubRegionName(sr.name)}
                  <span className="font-[var(--font-serif-text)] normal-case tracking-normal text-[11px] text-[var(--ink-3)]">
                    {sr.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── RELATED READING ───────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
          <span className="kicker">Further Reading</span>
          <h2 className="editorial-h2 text-[24px] sm:text-[28px] mt-2 mb-5">
            Related <em>reading.</em>
          </h2>
          <ul className="space-y-3 font-[var(--font-serif-text)] text-[15px]">
            {amenity === "dog" && (
              <li>
                <Link
                  href="/blog/dog-friendly-wineries-guide"
                  className="inline-flex items-center gap-2 text-[var(--ink-2)] underline decoration-[var(--brass)] underline-offset-4 hover:text-[var(--ink)]"
                >
                  <BookOpen className="h-4 w-4 text-[var(--brass)]" />
                  The complete dog-friendly wine country guide
                </Link>
              </li>
            )}
            {amenity === "kid" && (
              <li>
                <Link
                  href="/blog/wine-country-with-kids"
                  className="inline-flex items-center gap-2 text-[var(--ink-2)] underline decoration-[var(--brass)] underline-offset-4 hover:text-[var(--ink)]"
                >
                  <BookOpen className="h-4 w-4 text-[var(--brass)]" />
                  Wine country with kids — the complete guide
                </Link>
              </li>
            )}
            {amenity === "sustainable" && (
              <li>
                <Link
                  href="/blog/beyond-the-tasting-room"
                  className="inline-flex items-center gap-2 text-[var(--ink-2)] underline decoration-[var(--brass)] underline-offset-4 hover:text-[var(--ink)]"
                >
                  <BookOpen className="h-4 w-4 text-[var(--brass)]" />
                  Beyond the tasting room — vineyard experiences and farm tours
                </Link>
              </li>
            )}
          </ul>
        </section>

      </article>
    </>
  );
}
