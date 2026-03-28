import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Globe,
  Route,
  ChevronRight,
  Dog,
  Baby,
  Info,
  Check,
} from "lucide-react";
import {
  getAccommodationBySlug,
  getAccommodationPhotos,
  getNearbyWineries,
  getAllAccommodations,
} from "@/lib/accommodation-data";
import { WineryCard } from "@/components/directory/WineryCard";
import { AccommodationHero } from "@/components/accommodation/AccommodationHero";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import { Stay22Widget } from "@/components/accommodation/Stay22Widget";
import { BASE_URL } from "@/lib/constants";

const typeLabels: Record<string, string> = {
  hotel: "Hotel",
  inn: "Inn",
  resort: "Resort",
  vacation_rental: "Vacation Rental",
  bed_and_breakfast: "Bed & Breakfast",
};

const amenityLabels: Record<string, string> = {
  pool: "Pool",
  spa: "Spa",
  restaurant: "Restaurant",
  vineyard_views: "Vineyard Views",
  fitness_center: "Fitness Center",
  pet_friendly: "Pet Friendly",
  free_parking: "Free Parking",
  ev_charging: "EV Charging",
  concierge: "Concierge",
  room_service: "Room Service",
  hot_tub: "Hot Tub",
  fireplace: "In-Room Fireplace",
  breakfast_included: "Breakfast Included",
  balcony: "Private Balcony",
};

const wineFeatureLabels: Record<string, string> = {
  on_site_tasting: "On-Site Tasting Room",
  wine_tours: "Wine Tour Packages",
  vineyard_setting: "Vineyard Setting",
  wine_bar: "Wine Bar",
  sommelier: "Sommelier on Staff",
  cellar: "Wine Cellar",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const all = await getAllAccommodations();
  return all.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const accommodation = await getAccommodationBySlug(slug);
  if (!accommodation) return {};

  const title = `${accommodation.name} — Where to Stay in ${accommodation.valley === "napa" ? "Napa Valley" : "Sonoma County"}`;
  const description =
    accommodation.whyStayHere ||
    accommodation.shortDescription ||
    `${accommodation.name} in ${accommodation.city}, ${accommodation.valley === "napa" ? "Napa Valley" : "Sonoma County"}.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/where-to-stay/${slug}` },
    openGraph: {
      title,
      description,
      images: accommodation.heroImageUrl
        ? [{ url: accommodation.heroImageUrl }]
        : undefined,
    },
  };
}

export default async function AccommodationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const accommodation = await getAccommodationBySlug(slug);
  if (!accommodation) notFound();

  const [photos, nearbyWineries] = await Promise.all([
    getAccommodationPhotos(accommodation.id),
    getNearbyWineries(accommodation.id),
  ]);

  const amenities: string[] = accommodation.amenitiesJson
    ? JSON.parse(accommodation.amenitiesJson)
    : [];
  const wineFeatures: string[] = accommodation.wineFeatures
    ? JSON.parse(accommodation.wineFeatures)
    : [];
  const whyReasons: string[] = accommodation.whyThisHotel
    ? JSON.parse(accommodation.whyThisHotel)
    : [];

  const valleyLabel =
    accommodation.valley === "napa" ? "Napa Valley" : "Sonoma County";
  const valleyHref =
    accommodation.valley === "napa"
      ? "/where-to-stay/napa-valley"
      : "/where-to-stay/sonoma-county";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]"
        >
          <Link href="/" className="hover:text-[var(--foreground)]">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href="/where-to-stay"
            className="hover:text-[var(--foreground)]"
          >
            Where to Stay
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={valleyHref} className="hover:text-[var(--foreground)]">
            {valleyLabel}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[var(--foreground)] truncate">
            {accommodation.name}
          </span>
        </nav>
      </div>

      {/* Hero Carousel */}
      <div className="mt-2">
        <AccommodationHero accommodation={accommodation} photos={photos} />
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left column — main editorial content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Why Stay Here */}
            {accommodation.whyStayHere && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  Why Stay Here
                </h2>
                <p className="text-[var(--muted-foreground)] leading-relaxed text-lg">
                  {accommodation.whyStayHere}
                </p>
              </section>
            )}

            {/* Why This Hotel — contextual reasons */}
            {whyReasons.length > 0 && (
              <section>
                <ul className="space-y-2">
                  {whyReasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-[var(--muted-foreground)]">
                        {reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* The Setting */}
            {accommodation.theSetting && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  The Setting
                </h2>
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  {accommodation.theSetting}
                </p>
              </section>
            )}

            {/* The Experience */}
            {accommodation.theExperience && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  The Experience
                </h2>
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  {accommodation.theExperience}
                </p>
              </section>
            )}

            {/* Full description */}
            {accommodation.description && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  About {accommodation.name}
                </h2>
                <div className="text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
                  {accommodation.description}
                </div>
              </section>
            )}

            {/* Wine features */}
            {wineFeatures.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  Wine Country Perks
                </h2>
                <div className="flex flex-wrap gap-2">
                  {wineFeatures.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-burgundy-100 dark:bg-burgundy-900 px-3 py-1.5 text-sm font-medium text-burgundy-700 dark:text-burgundy-300"
                    >
                      {wineFeatureLabels[f] || f}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Before You Book */}
            {accommodation.beforeYouBook && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  Before You Book
                </h2>
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  {accommodation.beforeYouBook}
                </p>
              </section>
            )}

            {/* Nearby wineries */}
            {nearbyWineries.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-6">
                  Wineries Nearby
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {nearbyWineries.map((w) => (
                    <div key={w.slug} className="relative">
                      <WineryCard winery={w} />
                      {w.distanceMiles != null && (
                        <span className="absolute top-2 left-2 z-10 rounded-full bg-white/90 dark:bg-gray-900/90 px-2 py-0.5 text-xs font-medium">
                          {w.distanceMiles < 1
                            ? "< 1 mi"
                            : `${w.distanceMiles.toFixed(1)} mi`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column — sticky sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Booking CTA */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
                {accommodation.priceRangeMin && accommodation.priceRangeMax && (
                  <div className="text-center">
                    <span className="text-2xl font-bold">
                      ${accommodation.priceRangeMin}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {" "}– ${accommodation.priceRangeMax}/night
                    </span>
                  </div>
                )}
                <BookHotelCTA
                  bookingUrl={accommodation.bookingUrl}
                  websiteUrl={accommodation.websiteUrl}
                  accommodationId={accommodation.id}
                  accommodationSlug={accommodation.slug}
                  sourceComponent="sidebar_cta"
                  size="lg"
                />
                <p className="text-xs text-center text-[var(--muted-foreground)]">
                  Prices vary by season. Check the latest availability.
                </p>
              </div>

              {/* Stay22 Price Comparison */}
              {accommodation.lat && accommodation.lng && (
                <Stay22Widget
                  name={accommodation.name}
                  lat={accommodation.lat}
                  lng={accommodation.lng}
                />
              )}

              {/* Contact */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
                <h3 className="font-heading text-lg font-semibold">Contact</h3>
                {accommodation.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-[var(--muted-foreground)]" />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(accommodation.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-burgundy-700 dark:hover:text-burgundy-400"
                    >
                      {accommodation.address}
                    </a>
                  </div>
                )}
                {accommodation.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <a
                      href={`tel:${accommodation.phone}`}
                      className="hover:text-burgundy-700 dark:hover:text-burgundy-400"
                    >
                      {accommodation.phone}
                    </a>
                  </div>
                )}
                {accommodation.websiteUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <a
                      href={accommodation.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-burgundy-700 dark:hover:text-burgundy-400 truncate"
                    >
                      Visit website
                    </a>
                  </div>
                )}
              </div>

              {/* Amenities & Policies */}
              {(amenities.length > 0 ||
                accommodation.dogFriendly ||
                accommodation.kidFriendly ||
                accommodation.adultsOnly) && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
                  <h3 className="font-heading text-lg font-semibold">
                    Amenities & Policies
                  </h3>

                  {/* Dog / Kid / Adults Only */}
                  {(accommodation.dogFriendly ||
                    accommodation.kidFriendly ||
                    accommodation.adultsOnly) && (
                    <div className="space-y-2.5">
                      {accommodation.dogFriendly && (
                        <div className="flex items-start gap-2 text-sm">
                          <Dog className="h-4 w-4 mt-0.5 text-gold-600" />
                          <div>
                            <span className="font-medium text-gold-700 dark:text-gold-400">
                              Dog Friendly
                            </span>
                            {accommodation.dogFriendlyNote && (
                              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                {accommodation.dogFriendlyNote}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {accommodation.kidFriendly && (
                        <div className="flex items-start gap-2 text-sm">
                          <Baby className="h-4 w-4 mt-0.5 text-emerald-600" />
                          <div>
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                              Kid Friendly
                            </span>
                            {accommodation.kidFriendlyNote && (
                              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                {accommodation.kidFriendlyNote}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {accommodation.adultsOnly && (
                        <div className="flex items-start gap-2 text-sm">
                          <Info className="h-4 w-4 mt-0.5 text-burgundy-600" />
                          <span className="font-medium text-burgundy-700 dark:text-burgundy-400">
                            Adults Only
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-[var(--muted-foreground)] italic">
                        Confirm policies directly with the property before
                        booking.
                      </p>
                    </div>
                  )}

                  {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-medium"
                        >
                          {amenityLabels[a] || a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Plan a trip */}
              <Link
                href={`/plan-trip${accommodation.lat && accommodation.lng ? `?startLat=${accommodation.lat}&startLng=${accommodation.lng}&startName=${encodeURIComponent(accommodation.name)}` : ""}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                <Route className="h-4 w-4" />
                Plan a winery trip from here
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            name: accommodation.name,
            description:
              accommodation.whyStayHere || accommodation.shortDescription,
            url: `${BASE_URL}/where-to-stay/${accommodation.slug}`,
            address: accommodation.address
              ? {
                  "@type": "PostalAddress",
                  streetAddress: accommodation.address,
                  addressLocality: accommodation.city,
                  addressRegion: "CA",
                }
              : undefined,
            geo:
              accommodation.lat && accommodation.lng
                ? {
                    "@type": "GeoCoordinates",
                    latitude: accommodation.lat,
                    longitude: accommodation.lng,
                  }
                : undefined,
            telephone: accommodation.phone || undefined,
            image: accommodation.heroImageUrl || undefined,
            priceRange: accommodation.priceTier
              ? "$".repeat(accommodation.priceTier)
              : undefined,
            aggregateRating:
              accommodation.googleRating
                ? {
                    "@type": "AggregateRating",
                    ratingValue: accommodation.googleRating,
                    reviewCount: accommodation.googleReviewCount || undefined,
                    bestRating: 5,
                  }
                : undefined,
          }),
        }}
      />
    </div>
  );
}
