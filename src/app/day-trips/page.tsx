import Link from "next/link";
import { db } from "@/db";
import { dayTripRoutes, dayTripStops } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Clock, MapPin, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Day Trip Routes | Wine Country Guide",
  description:
    "Curated day-trip itineraries for Napa and Sonoma wine country. Budget-friendly, luxury, dog-friendly, and themed wine tours.",
  openGraph: {
    title: "Day Trip Routes | Wine Country Guide",
    description:
      "Curated day-trip itineraries for Napa and Sonoma wine country.",
    url: "https://napa-winery-search.vercel.app/day-trips",
    siteName: "Wine Country Guide",
    type: "website",
  },
};

const THEME_COLORS: Record<string, string> = {
  cabernet:
    "bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300",
  budget:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  "dog-friendly":
    "bg-olive-100 text-olive-700 dark:bg-olive-900 dark:text-olive-300",
  luxury:
    "bg-gold-100 text-gold-700 dark:bg-gold-900 dark:text-gold-300",
  historic:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "pinot-chardonnay":
    "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
};

export default async function DayTripsPage() {
  const routes = await db
    .select({
      id: dayTripRoutes.id,
      slug: dayTripRoutes.slug,
      title: dayTripRoutes.title,
      description: dayTripRoutes.description,
      region: dayTripRoutes.region,
      theme: dayTripRoutes.theme,
      estimatedHours: dayTripRoutes.estimatedHours,
      stopCount: count(dayTripStops.id),
    })
    .from(dayTripRoutes)
    .leftJoin(dayTripStops, eq(dayTripRoutes.id, dayTripStops.routeId))
    .groupBy(dayTripRoutes.id)
    .orderBy(dayTripRoutes.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Day Trip Routes</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Curated itineraries to help you make the most of your wine country
          visit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <Link
            key={route.id}
            href={`/day-trips/${route.slug}`}
            className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                {route.title}
              </h2>
              {route.theme && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${THEME_COLORS[route.theme] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
                >
                  {route.theme.replace("-", " ")}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-[var(--muted-foreground)] line-clamp-3 flex-1">
              {route.description}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
              {route.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {route.region}
                </span>
              )}
              {route.estimatedHours && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {route.estimatedHours}h
                </span>
              )}
              <span>{route.stopCount} stops</span>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-burgundy-700 dark:text-burgundy-400">
              View route <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
