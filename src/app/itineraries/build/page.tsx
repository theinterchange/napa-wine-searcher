import type { Metadata } from "next";
import { PreferenceBuilder } from "@/components/itinerary/PreferenceBuilder";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Build your Napa & Sonoma trip",
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
    <main className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-14">
      <PreferenceBuilder
        defaultValley={
          valley === "napa" || valley === "sonoma" ? valley : ""
        }
      />
    </main>
  );
}
