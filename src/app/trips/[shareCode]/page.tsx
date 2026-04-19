import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadTripByShareCode } from "@/lib/itinerary/load-trip";
import { getAccommodationsForTripStops } from "@/lib/itinerary/nearby-accommodations";
import { TripPage } from "@/components/itinerary/TripPage";

interface PageProps {
  params: Promise<{ shareCode: string }>;
}

export const metadata: Metadata = {
  title: "Your Napa & Sonoma trip",
  robots: { index: false, follow: false },
};

export default async function SharedTripPage({ params }: PageProps) {
  const { shareCode } = await params;
  const trip = await loadTripByShareCode(shareCode);
  if (!trip) notFound();

  const accommodations = await getAccommodationsForTripStops(
    trip.stops.map((s) => s.wineryId),
    3
  );

  return <TripPage initialTrip={trip} initialAccommodations={accommodations} />;
}
