/**
 * Layout for accommodation category landing pages (dog-friendly hotels,
 * family-friendly hotels).
 *
 * Structurally mirrors CategoryLandingLayout but specialized for
 * accommodations: AccommodationCards with booking CTAs, cross-link to
 * matching winery category, and LodgingBusiness JSON-LD.
 *
 * Server component — no client-side interactivity.
 */
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Bed, BookOpen } from "lucide-react";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { FAQSection } from "@/components/region/FAQSection";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { AccommodationCategoryJsonLd } from "@/components/seo/AccommodationCategoryJsonLd";
import { BASE_URL } from "@/lib/constants";
import type { AccommodationAmenity, Valley } from "@/lib/category-data";
import {
  getAccommodationCategoryFaqs,
  type AccommodationCategoryMeta,
} from "@/lib/accommodation-category-content";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";

type AccommodationScope = { kind: "hub" } | { kind: "valley"; valley: Valley };

interface AccommodationCategoryLayoutProps {
  amenity: AccommodationAmenity;
  scope: AccommodationScope;
  meta: AccommodationCategoryMeta;
  deck: string;
  hero: { url: string; name: string; slug: string } | null;
  accommodations: AccommodationCardData[];
}

const VALLEY_LABEL: Record<Valley, string> = {
  napa: "Napa Valley",
  sonoma: "Sonoma County",
};

const CLUSTER_ROOT: Record<AccommodationAmenity, string> = {
  dog: "/dog-friendly-hotels",
};

const CLUSTER_LABEL: Record<AccommodationAmenity, string> = {
  dog: "Dog-Friendly Hotels",
};

const WINERY_CLUSTER: Record<AccommodationAmenity, { root: string; label: string }> = {
  dog: { root: "/dog-friendly-wineries", label: "dog-friendly wineries" },
};

function buildBreadcrumb(
  amenity: AccommodationAmenity,
  scope: AccommodationScope
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
  }
  return items;
}

export function AccommodationCategoryLayout({
  amenity,
  scope,
  meta,
  deck,
  hero,
  accommodations,
}: AccommodationCategoryLayoutProps) {
  const root = CLUSTER_ROOT[amenity];
  const pageUrl = `${BASE_URL}${root}${meta.pathSegments.length ? "/" + meta.pathSegments.join("/") : ""}`;
  const breadcrumb = buildBreadcrumb(amenity, scope);
  const faqs = getAccommodationCategoryFaqs(amenity);
  const wineryCluster = WINERY_CLUSTER[amenity];

  // Winery cross-link URL — valley-specific if on a valley page, hub otherwise
  const wineryHref =
    scope.kind === "valley"
      ? `${wineryCluster.root}/${scope.valley === "napa" ? "napa-valley" : "sonoma-county"}`
      : wineryCluster.root;

  return (
    <>
      <AccommodationCategoryJsonLd
        amenity={amenity}
        pageUrl={pageUrl}
        pageName={meta.h1}
        pageDescription={meta.description}
        accommodations={accommodations}
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
                alt={`${hero.name} — ${meta.h1}`}
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
                <Bed className="h-48 w-48" />
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
              className="font-[var(--font-heading)] text-white text-[34px] sm:text-[44px] lg:text-[56px] leading-[1.05] tracking-[-0.015em] font-normal max-w-[20ch]"
              style={{ textWrap: "balance", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
            >
              {(() => {
                const parts = meta.h1.split(" ");
                if (parts.length === 1) return meta.h1;
                const last = parts.pop();
                return (
                  <>
                    {parts.join(" ")}{" "}
                    <em
                      className="italic font-normal"
                      style={{ color: "#f0d894" }}
                    >
                      {last}
                    </em>
                  </>
                );
              })()}
            </h1>

            <hr className="rule-brass mt-5" style={{ marginInline: 0 }} />
          </div>

          {hero && (
            <div className="absolute bottom-3 right-4 sm:right-6 lg:right-8 z-10">
              <Link
                href={`/where-to-stay/${hero.slug}`}
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/60 hover:text-white/90 transition-colors"
              >
                Photo: {hero.name} →
              </Link>
            </div>
          )}
        </div>

        {/* ── BODY LEAD ──────────────────────────────────────────────── */}
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

        {/* ── THE ACCOMMODATIONS ─────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-16">
          <div className="border-b border-[var(--rule)] pb-4 mb-8 flex items-baseline justify-between gap-4">
            <span className="kicker">The Hotels</span>
            <span className="font-[var(--font-serif-text)] text-[13px] text-[var(--ink-3)]">
              {accommodations.length} {accommodations.length === 1 ? "stay" : "stays"}
            </span>
          </div>
          {accommodations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((a) => (
                <AccommodationCard
                  key={a.slug}
                  accommodation={a}
                  sourceComponent="AccommodationCategoryLayout"
                />
              ))}
            </div>
          ) : (
            <p className="font-[var(--font-serif-text)] text-[var(--ink-3)]">
              No accommodations currently match this filter.
            </p>
          )}
        </section>

        {/* ── PLAN A TASTING DAY (cross-link to winery category) ────── */}
        <section className="border-t border-[var(--rule-soft)] bg-[var(--paper-2)]/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="border-b border-[var(--rule)] pb-4 mb-6">
              <span className="kicker">Plan a Tasting Day</span>
              <h2 className="editorial-h2 text-[28px] sm:text-[34px] mt-2">
                Plan a tasting <em>day.</em>
              </h2>
              <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-2xl" style={{ textWrap: "pretty" }}>
                Once you&apos;ve settled in, browse the {wineryCluster.label} within easy driving distance — outdoor patios, water bowls at the host stand, and hosts who welcome four-legged guests.
              </p>
            </div>
            <Link
              href={wineryHref}
              className="inline-flex items-center gap-2 bg-[var(--ink)] px-5 py-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-white hover:bg-[var(--brass-2)] transition-colors"
            >
              Browse {wineryCluster.label}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
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

        {/* ── SIBLING VALLEY LINKS ───────────────────────────────────── */}
        {scope.kind === "valley" && (
          <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
            <span className="kicker">Across The Hill</span>
            <h2 className="editorial-h2 text-[24px] sm:text-[28px] mt-2 mb-5">
              Also in <em>{scope.valley === "napa" ? "Sonoma." : "Napa."}</em>
            </h2>
            <Link
              href={`${root}/${scope.valley === "napa" ? "sonoma-county" : "napa-valley"}`}
              className="inline-flex items-center gap-1.5 border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:border-[var(--brass)] hover:text-[var(--ink)] transition-colors"
            >
              {CLUSTER_LABEL[amenity]} in {scope.valley === "napa" ? "Sonoma County" : "Napa Valley"}
            </Link>
          </section>
        )}

        {/* ── RELATED READING ────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
          <span className="kicker">Further Reading</span>
          <h2 className="editorial-h2 text-[24px] sm:text-[28px] mt-2 mb-5">
            Related <em>reading.</em>
          </h2>
          <ul className="space-y-3 font-[var(--font-serif-text)] text-[15px]">
            <li>
              <Link
                href="/blog/dog-friendly-wineries-guide"
                className="inline-flex items-center gap-2 text-[var(--ink-2)] underline decoration-[var(--brass)] underline-offset-4 hover:text-[var(--ink)]"
              >
                <BookOpen className="h-4 w-4 text-[var(--brass)]" />
                The complete dog-friendly wine country guide
              </Link>
            </li>
            <li>
              <Link
                href="/where-to-stay"
                className="inline-flex items-center gap-2 text-[var(--ink-2)] underline decoration-[var(--brass)] underline-offset-4 hover:text-[var(--ink)]"
              >
                <BookOpen className="h-4 w-4 text-[var(--brass)]" />
                Browse all places to stay
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </>
  );
}
