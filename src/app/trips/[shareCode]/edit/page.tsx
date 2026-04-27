import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadTripByShareCode } from "@/lib/itinerary/load-trip";
import { getAccommodationsForTripStops } from "@/lib/itinerary/nearby-accommodations";
import { TripPage } from "@/components/itinerary/TripPage";
import type { StayContext } from "@/components/itinerary/StayPicker";

interface PageProps {
  params: Promise<{ shareCode: string }>;
  searchParams: Promise<{
    stay?: string;
    dogs?: string;
    kids?: string;
    vibe?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Edit your Napa & Sonoma trip",
  robots: { index: false, follow: false },
};

export default async function EditTripPage({ params, searchParams }: PageProps) {
  const { shareCode } = await params;
  const { stay, dogs, kids, vibe } = await searchParams;
  const trip = await loadTripByShareCode(shareCode);
  if (!trip) notFound();

  const needsStay = stay === "1";
  const accommodations = await getAccommodationsForTripStops(
    trip.stops.map((s) => s.wineryId),
    needsStay ? 12 : 3
  );

  const initialContext: StayContext = {
    dogs: dogs === "1",
    kids: kids === "1",
    vibe: vibe ?? null,
  };

  return (
    <TripPage
      initialTrip={{ ...trip, isEditable: true }}
      initialAccommodations={accommodations}
      initialNeedsStay={needsStay}
      initialContext={initialContext}
    />
  );
}
