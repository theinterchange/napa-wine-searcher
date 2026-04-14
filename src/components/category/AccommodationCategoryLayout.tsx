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
        <div className="relative bg-burgundy-900 dark:bg-burgundy-950 text-white overflow-hidden">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-burgundy-800 via-burgundy-900 to-burgundy-950">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Bed className="h-48 w-48" />
              </div>
            </div>
          )}

          <div className="relative mx-auto max-w-5xl px-4 pt-28 sm:pt-36 lg:pt-48 pb-10 sm:pb-12 lg:pb-16 sm:px-6 lg:px-8">
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

          {hero && (
            <div className="absolute bottom-3 right-4 sm:right-6 lg:right-8 z-10">
              <Link
                href={`/where-to-stay/${hero.slug}`}
                className="text-[11px] text-white/60 hover:text-white/90 transition-colors"
              >
                Photo: {hero.name} →
              </Link>
            </div>
          )}
        </div>

        {/* ── BODY LEAD ──────────────────────────────────────────────── */}
        {deck && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
            <p className="max-w-3xl text-lg leading-relaxed text-[var(--foreground)] text-pretty">
              {deck}
            </p>
          </div>
        )}

        {/* ── THE ACCOMMODATIONS ─────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-16">
          <h2 className="font-heading text-2xl font-bold mb-6 text-balance">
            The hotels
          </h2>
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
            <p className="text-[var(--muted-foreground)]">
              No accommodations currently match this filter.
            </p>
          )}
        </section>

        {/* ── PLAN A TASTING DAY (cross-link to winery category) ────── */}
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <h2 className="font-heading text-2xl font-bold text-balance">
                  Plan a tasting day
                </h2>
                <p className="mt-2 text-base text-[var(--muted-foreground)] max-w-2xl">
                  Once you've settled in, browse the dog-friendly wineries within easy driving distance — outdoor patios, water bowls at the host stand, and hosts who welcome four-legged guests.
                </p>
              </div>
            </div>
            <Link
              href={wineryHref}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-colors"
            >
              Browse {wineryCluster.label}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        {faqs.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="font-heading text-2xl font-bold mb-6 text-balance">
              Frequently asked questions
            </h2>
            <FAQSection faqs={faqs} />
          </section>
        )}

        {/* ── SIBLING VALLEY LINKS ───────────────────────────────────── */}
        {scope.kind === "valley" && (
          <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
            <h2 className="font-heading text-2xl font-bold mb-4 text-balance">
              Also in {scope.valley === "napa" ? "Sonoma County" : "Napa Valley"}
            </h2>
            <Link
              href={`${root}/${scope.valley === "napa" ? "sonoma-county" : "napa-valley"}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-colors"
            >
              {CLUSTER_LABEL[amenity]} in {scope.valley === "napa" ? "Sonoma County" : "Napa Valley"}
            </Link>
          </section>
        )}

        {/* ── RELATED READING ────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-heading text-2xl font-bold mb-4 text-balance">
            Related reading
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/blog/dog-friendly-wineries-guide"
                className="inline-flex items-center gap-2 text-[var(--foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-300 underline-offset-4 hover:underline"
              >
                <BookOpen className="h-4 w-4" />
                The complete dog-friendly wine country guide
              </Link>
            </li>
            <li>
              <Link
                href="/where-to-stay"
                className="inline-flex items-center gap-2 text-[var(--foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-300 underline-offset-4 hover:underline"
              >
                <BookOpen className="h-4 w-4" />
                Browse all places to stay
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </>
  );
}
