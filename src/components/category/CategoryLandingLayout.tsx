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
        {/* ── HERO ──────────────────────────────────────────────────────
            Full-bleed feature image with dark gradient and white text
            overlay. Matches the visual language of WineryHero so the
            category pages and detail pages feel like one site. */}
        <div className="relative bg-burgundy-900 dark:bg-burgundy-950 text-white overflow-hidden">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-burgundy-800 via-burgundy-900 to-burgundy-950">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Wine className="h-48 w-48" />
              </div>
            </div>
          )}

          <div className="relative mx-auto max-w-5xl px-4 pt-28 sm:pt-36 lg:pt-48 pb-10 sm:pb-12 lg:pb-16 sm:px-6 lg:px-8">
            {/* Inline breadcrumb (white-on-dark) */}
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1 text-sm text-white/70 mb-5"
            >
              {breadcrumb.map((item, i) => (
                <span key={item.href} className="inline-flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
                  {i === breadcrumb.length - 1 ? (
                    <span className="text-white">{item.name}</span>
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

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance max-w-4xl">
              {meta.h1}
            </h1>
          </div>

          {/* Photo credit — small, bottom corner, links to the featured
              winery's detail page for free inbound link equity */}
          {hero && (
            <div className="absolute bottom-3 right-4 sm:right-6 lg:right-8 z-10">
              <Link
                href={`/wineries/${hero.winerySlug}`}
                className="text-[11px] text-white/60 hover:text-white/90 transition-colors"
              >
                Photo: {hero.wineryName} →
              </Link>
            </div>
          )}
        </div>

        {/* ── BODY LEAD ─────────────────────────────────────────────────
            Single paragraph that sits between the hero and the winery grid.
            text-lg matches the WineryHero shortDescription convention used
            on the site. Inner max-w-3xl constrains line length for
            readability without breaking the outer max-w-5xl alignment. */}
        {deck && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
            <p className="max-w-3xl text-lg leading-relaxed text-[var(--foreground)] text-pretty">
              {deck}
            </p>
          </div>
        )}

        {/* ── THE WINERIES ──────────────────────────────────────────────
            Functional guide pages exist to deliver the list. Body lead
            above handles the elevator pitch; the wineries appear
            immediately after with no further editorial buffer. */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-16">
          <h2 className="font-heading text-2xl font-bold mb-6 text-balance">
            The wineries
          </h2>
          {wineries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wineries.map((w) => (
                <CategoryWineryCard key={w.id} amenity={amenity} winery={w} />
              ))}
            </div>
          ) : (
            <p className="text-[var(--muted-foreground)]">
              No wineries currently match this filter.
            </p>
          )}
        </section>

        {/* ── MAKE IT A WEEKEND (revenue moment) ────────────────────── */}
        {nearbyAccommodations.length > 0 && (
          <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex items-end justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-balance">
                    Make it a weekend
                  </h2>
                  <p className="mt-2 text-base text-[var(--muted-foreground)] max-w-2xl">
                    {amenity === "dog"
                      ? "Dog-friendly hotels, inns, and resorts within easy driving distance — the natural extension of an afternoon in tasting rooms."
                      : amenity === "kid"
                        ? "Family-welcoming places to stay within easy reach of these wineries."
                        : "Wine-country places to stay within easy reach of these wineries."}
                  </p>
                </div>
                <Link
                  href={amenity === "dog" ? "/dog-friendly-hotels" : "/where-to-stay"}
                  className="hidden sm:inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  See all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {nearbyAccommodations.map((a) => (
                  <AccommodationCard
                    key={a.slug}
                    accommodation={a}
                    sourceComponent="CategoryLandingLayoutV2"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        {faqs.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="font-heading text-2xl font-bold mb-6 text-balance">
              Frequently asked questions
            </h2>
            <FAQSection faqs={faqs} />
          </section>
        )}

        {/* ── SIBLING SPOKES (subregion only) ───────────────────────── */}
        {siblingSubregions.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
            <h2 className="font-heading text-2xl font-bold mb-4 text-balance">
              Other {CLUSTER_LABEL[amenity].toLowerCase()} nearby
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblingSubregions.map((sr) => (
                <Link
                  key={sr.slug}
                  href={`${root}/${sr.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-colors"
                >
                  <MapPin className="h-3 w-3 text-[var(--muted-foreground)]" />
                  {displaySubRegionName(sr.name)}
                  <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
                    {sr.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── RELATED READING ───────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-heading text-2xl font-bold mb-4 text-balance">
            Related reading
          </h2>
          <ul className="space-y-2 text-sm">
            {amenity === "dog" && (
              <li>
                <Link
                  href="/blog/dog-friendly-wineries-guide"
                  className="inline-flex items-center gap-2 text-[var(--foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-300 underline-offset-4 hover:underline"
                >
                  <BookOpen className="h-4 w-4" />
                  The complete dog-friendly wine country guide
                </Link>
              </li>
            )}
            {amenity === "kid" && (
              <li>
                <Link
                  href="/blog/wine-country-with-kids"
                  className="inline-flex items-center gap-2 text-[var(--foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-300 underline-offset-4 hover:underline"
                >
                  <BookOpen className="h-4 w-4" />
                  Wine country with kids — the complete guide
                </Link>
              </li>
            )}
            {amenity === "sustainable" && (
              <li>
                <Link
                  href="/blog/beyond-the-tasting-room"
                  className="inline-flex items-center gap-2 text-[var(--foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-300 underline-offset-4 hover:underline"
                >
                  <BookOpen className="h-4 w-4" />
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
