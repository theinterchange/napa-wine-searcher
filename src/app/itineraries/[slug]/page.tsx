import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadCuratedTrip } from "@/lib/itinerary/load-trip";
import { getAccommodationsForTripStops } from "@/lib/itinerary/nearby-accommodations";
import { TripPage } from "@/components/itinerary/TripPage";
import { BASE_URL } from "@/lib/constants";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await loadCuratedTrip(slug);
  if (!trip) return { title: "Itinerary not found" };
  const description =
    trip.editorialPull ??
    `${trip.stops.length} hand-picked Napa and Sonoma wineries with drive times, reservation tips, and where to stay.`;
  return {
    title: `${trip.name} | Napa Sonoma Guide`,
    description,
    alternates: { canonical: `${BASE_URL}/itineraries/${slug}` },
    openGraph: {
      title: trip.name,
      description,
      url: `${BASE_URL}/itineraries/${slug}`,
      type: "article",
      images: trip.heroImageUrl ? [{ url: trip.heroImageUrl }] : undefined,
    },
  };
}

export default async function CuratedItineraryPage({ params }: PageProps) {
  const { slug } = await params;
  const trip = await loadCuratedTrip(slug);
  if (!trip) notFound();

  const accommodations = await getAccommodationsForTripStops(
    trip.stops.map((s) => s.wineryId),
    3
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trip.name,
    description: trip.editorialPull ?? undefined,
    url: `${BASE_URL}/itineraries/${slug}`,
    itinerary: trip.stops.map((s, i) => ({
      "@type": "TouristAttraction",
      position: i + 1,
      name: s.name,
      url: `${BASE_URL}/wineries/${s.slug}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: s.city ?? undefined,
        addressRegion: "CA",
      },
      geo:
        s.lat != null && s.lng != null
          ? {
              "@type": "GeoCoordinates",
              latitude: s.lat,
              longitude: s.lng,
            }
          : undefined,
      priceRange:
        s.priceLevel != null ? "$".repeat(s.priceLevel) : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TripPage initialTrip={trip} initialAccommodations={accommodations} />
    </>
  );
}
