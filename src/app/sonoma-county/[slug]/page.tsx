import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Grape, Route, Clock } from "lucide-react";
import { getSubRegionDetail, getAllSubRegions } from "@/lib/region-data";
import { SUBREGION_CONTENT } from "@/lib/region-content";
import { WineryCard } from "@/components/directory/WineryCard";
import { SubRegionGrid } from "@/components/region/SubRegionGrid";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";

import { BASE_URL } from "@/lib/constants";

export async function generateStaticParams() {
  const regions = await getAllSubRegions("sonoma");
  return regions.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSubRegionDetail(slug);
  if (!data || data.region.valley !== "sonoma") return { title: "Not Found" };

  const content = SUBREGION_CONTENT[slug];
  const title = `${data.region.name} Wineries | Sonoma County Guide`;
  const description =
    content?.description[0]?.slice(0, 160) ??
    `Explore ${data.wineries.length} wineries in ${data.region.name}, Sonoma County.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/sonoma-county/${slug}`,
      siteName: "Napa Sonoma Guide",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SonomaSubRegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getSubRegionDetail(slug);
  if (!data || data.region.valley !== "sonoma") notFound();

  const content = SUBREGION_CONTENT[slug];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Sonoma County", href: "/sonoma-county" },
          { name: data.region.name, href: `/sonoma-county/${slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]"
        >
          <Link
            href="/"
            className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link
            href="/sonoma-county"
            className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
          >
            Sonoma County
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span
            className="text-[var(--foreground)] font-medium truncate"
            aria-current="page"
          >
            {data.region.name}
          </span>
        </nav>
      </div>

      {/* Hero with region image */}
      {(() => {
        const topWinery = data.wineries.find((w) => w.heroImageUrl);
        return topWinery?.heroImageUrl ? (
          <div className="relative bg-burgundy-900 text-white overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${topWinery.heroImageUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
            <div className="relative mx-auto max-w-7xl px-4 pt-32 sm:pt-40 pb-8 sm:px-6 lg:px-8">
              <h1 className="font-heading text-3xl sm:text-4xl font-bold">
                {data.region.name} Wineries
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span>{data.wineries.length} wineries in our guide</span>
                {content && (
                  <>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <Grape className="h-3.5 w-3.5" />
                      Known for {content.signatureVarietal}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold">
              {data.region.name} Wineries
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
              <span>{data.wineries.length} wineries in our guide</span>
              {content && (
                <>
                  <span className="text-[var(--border)]">|</span>
                  <span className="flex items-center gap-1">
                    <Grape className="h-3.5 w-3.5" />
                    Known for {content.signatureVarietal}
                  </span>
                </>
              )}
            </div>
          </section>
        );
      })()}

      {/* About Sub-Region */}
      {content && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-4">
            About {data.region.name}
          </h2>

          {content.whyVisit && (
            <p className="text-base leading-relaxed text-[var(--muted-foreground)] mb-6 max-w-3xl">
              {content.whyVisit}
            </p>
          )}

          <div className="max-w-3xl space-y-4 text-[var(--muted-foreground)] leading-relaxed">
            {content.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {content.topExperiences && content.topExperiences.length > 0 && (
            <div className="mt-8 max-w-3xl">
              <h3 className="font-heading text-xl font-semibold mb-4">
                Top Experiences in {data.region.name}
              </h3>
              <ul className="space-y-3">
                {content.topExperiences.map((exp, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[var(--muted-foreground)]">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-burgundy-500 shrink-0" />
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.insiderTip && (
            <div className="mt-8 max-w-3xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-2">Local Tip</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                {content.insiderTip}
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                Known For
              </h3>
              <p className="text-sm">{content.knownFor.join(", ")}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                Terroir
              </h3>
              <p className="text-sm">{content.terroir}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                Best Time to Visit
              </h3>
              <p className="text-sm">{content.bestTimeToVisit}</p>
            </div>
          </div>
        </section>
      )}

      {/* All Wineries */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.wineries.map((w) => (
            <WineryCard key={w.slug} winery={w} />
          ))}
        </div>
      </section>

      {/* Related Day Trips */}
      {data.relatedTrips.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-6">
            Day Trips in {data.region.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.relatedTrips.map((trip) => (
              <Link
                key={trip.slug}
                href={`/day-trips/${trip.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-burgundy-400 hover:shadow-sm dark:hover:border-burgundy-600 transition-all"
              >
                <Route className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors line-clamp-1">
                    {trip.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                    {trip.theme && (
                      <span className="rounded-full bg-burgundy-50 dark:bg-burgundy-950 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-300">
                        {trip.theme}
                      </span>
                    )}
                    {trip.estimatedHours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {trip.estimatedHours}h
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Explore More of Sonoma County */}
      {data.siblingRegions.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--card)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold mb-6">
              Explore More of Sonoma County
            </h2>
            <SubRegionGrid
              subRegions={data.siblingRegions}
              valley="sonoma"
            />
          </div>
        </section>
      )}
    </>
  );
}
