import type { Metadata } from "next";
import { PreferenceBuilder } from "@/components/itinerary/PreferenceBuilder";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Build your Napa & Sonoma trip | Napa Sonoma Guide",
  description:
    "A few questions and a full itinerary: who's going, how long, and where you're starting. Every recommendation pulls from verified winery data.",
  alternates: { canonical: `${BASE_URL}/itineraries/build` },
};

interface PageProps {
  searchParams: Promise<{ valley?: string }>;
}

export default async function BuildItineraryPage({ searchParams }: PageProps) {
  const { valley } = await searchParams;
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Build your trip
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Three questions, then a full itinerary you can edit — swap stops, add
          more, or save the result.
        </p>
      </header>
      <PreferenceBuilder
        defaultValley={
          valley === "napa" || valley === "sonoma" ? valley : ""
        }
      />
    </main>
  );
}
