import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import { PlanTripClient } from "./PlanTripClient";

export const metadata: Metadata = {
  title: "Plan Your Trip | Napa Sonoma Guide",
  description:
    "Build a custom wine country day trip. Choose your style, shuffle routes, swap wineries, and share your itinerary.",
  openGraph: {
    title: "Plan Your Trip | Napa Sonoma Guide",
    description:
      "Build a custom wine country day trip. Choose your style, shuffle routes, swap wineries, and share your itinerary.",
    url: `${BASE_URL}/plan-trip`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
};

export default async function PlanTripPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1 text-sm text-[var(--muted-foreground)]"
      >
        <Link
          href="/"
          className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
        >
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span
          className="text-[var(--foreground)] font-medium"
          aria-current="page"
        >
          Plan Your Trip
        </span>
      </nav>

      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Plan Your Trip</h1>
        <p className="mt-3 text-[var(--muted-foreground)] max-w-2xl">
          Build a custom wine country itinerary. Pick a style, set your
          preferences, and we&apos;ll generate an optimized route. Swap wineries,
          shuffle for fresh picks, or share your plan with friends.
        </p>
      </div>

      <PlanTripClient
        initialFrom={params.from}
        initialTheme={params.theme}
        initialStops={params.stops}
        initialValley={params.valley}
        autoWizard={params.wizard === "1"}
      />
    </div>
  );
}
