import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
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
import { FAQSection } from "@/components/region/FAQSection";
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

  // Parse enriched content
  interface RoomType {
    name: string;
    description: string;
    sleeps: number | null;
    highlights: string[];
  }
  interface DiningVenue {
    name: string;
    description: string;
    type: string;
  }
  interface SpaInfo {
    name: string | null;
    description: string | null;
    highlights: string[];
  }
  interface Activity {
    name: string;
    description: string;
  }

  const rooms: RoomType[] = accommodation.roomsJson
    ? JSON.parse(accommodation.roomsJson)
    : [];
  const dining: DiningVenue[] = accommodation.diningJson
    ? JSON.parse(accommodation.diningJson)
    : [];
  const spa: SpaInfo | null = accommodation.spaJson
    ? JSON.parse(accommodation.spaJson)
    : null;
  const activities: Activity[] = accommodation.activitiesJson
    ? JSON.parse(accommodation.activitiesJson)
    : [];
  const childrenAmenities: string[] = accommodation.childrenAmenitiesJson
    ? JSON.parse(accommodation.childrenAmenitiesJson)
    : [];

  // Get section-specific photos
  const photosByCategory = new Map<string, typeof photos>();
  for (const p of photos) {
    const cat = p.category || "other";
    if (!photosByCategory.has(cat)) photosByCategory.set(cat, []);
    photosByCategory.get(cat)!.push(p);
  }
  const roomPhoto = photosByCategory.get("room")?.[0];
  const diningPhoto = photosByCategory.get("dining")?.[0];
  const spaPhoto = photosByCategory.get("spa_pool")?.[0];
  const groundsPhoto =
    photosByCategory.get("grounds")?.[0] ||
    photosByCategory.get("exterior")?.[0] ||
    photosByCategory.get("view")?.[0];

  const valleyLabel =
    accommodation.valley === "napa" ? "Napa Valley" : "Sonoma County";
  const valleyHref =
    accommodation.valley === "napa"
      ? "/where-to-stay/napa-valley"
      : "/where-to-stay/sonoma-county";

  // Build FAQs
  const faqs: { question: string; answer: string }[] = [];
  const name = accommodation.name;

  if (accommodation.dogFriendly != null) {
    faqs.push({
      question: `Is ${name} dog-friendly?`,
      answer: accommodation.dogFriendly
        ? `Yes, ${name} welcomes dogs.${accommodation.dogFriendlyNote ? ` ${accommodation.dogFriendlyNote}` : ""} We recommend confirming pet policies and any fees directly with the property before booking.`
        : `No, ${name} does not allow pets. Consider nearby pet-friendly accommodations in the area.`,
    });
  }

  if (accommodation.adultsOnly) {
    faqs.push({
      question: `Is ${name} family-friendly?`,
      answer: `${name} is an adults-only property. It's best suited for couples or groups without children.`,
    });
  } else if (accommodation.kidFriendly) {
    faqs.push({
      question: `Is ${name} family-friendly?`,
      answer: `Yes, ${name} welcomes families with children.${accommodation.kidFriendlyNote ? ` ${accommodation.kidFriendlyNote}` : ""} Contact the property for details on family accommodations.`,
    });
  }

  if (accommodation.priceTier) {
    const desc: Record<number, string> = {
      1: "a budget-friendly option",
      2: "moderately priced",
      3: "an upscale property",
      4: "a luxury property",
    };
    faqs.push({
      question: `How much does ${name} cost per night?`,
      answer: `${name} is ${desc[accommodation.priceTier] || "moderately priced"} (${"$".repeat(accommodation.priceTier)}).${
        accommodation.priceRangeMin && accommodation.priceRangeMax
          ? ` Rates typically range from $${accommodation.priceRangeMin} to $${accommodation.priceRangeMax} per night depending on the season and room type.`
          : " Rates vary by season and room type — check availability for current pricing."
      }`,
    });
  }

  if (nearbyWineries.length > 0) {
    const wineryNames = nearbyWineries
      .slice(0, 3)
      .map(
        (w) =>
          `${w.name}${w.distanceMiles ? ` (${w.distanceMiles < 1 ? "< 1" : w.distanceMiles.toFixed(1)} mi)` : ""}`
      );
    faqs.push({
      question: `What wineries are near ${name}?`,
      answer: `${name} is conveniently located near several wineries including ${wineryNames.join(", ")}${nearbyWineries.length > 3 ? `, and ${nearbyWineries.length - 3} more` : ""}. The ${accommodation.subRegion || valleyLabel} region offers excellent wine tasting opportunities within a short drive.`,
    });
  }

  if (amenities.length > 0) {
    faqs.push({
      question: `What amenities does ${name} offer?`,
      answer: `${name} offers ${amenities.map((a) => amenityLabels[a] || a).join(", ").toLowerCase()}.${wineFeatures.length > 0 ? ` Wine country perks include ${wineFeatures.map((f) => wineFeatureLabels[f] || f).join(", ").toLowerCase()}.` : ""}`,
    });
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:items-start">
          {/* Left column — narrative content */}
          <div className="lg:col-span-2 space-y-12">
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

            {/* The Setting */}
            {accommodation.theSetting && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-6">
                  The Setting
                </h2>
                {groundsPhoto && (
                  <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-6">
                    <Image
                      src={groundsPhoto.url}
                      alt={`${accommodation.name} setting`}
                      fill
                      sizes="(max-width: 768px) 100vw, 680px"
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  {accommodation.theSetting}
                </p>
              </section>
            )}

            {/* Rooms & Suites */}
            {rooms.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-6">
                  Rooms & Suites
                </h2>
                {roomPhoto && (
                  <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-6">
                    <Image
                      src={roomPhoto.url}
                      alt={`Room at ${accommodation.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 680px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rooms.slice(0, 6).map((room, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
                    >
                      <h3 className="font-heading font-semibold text-lg mb-2">
                        {room.name}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                        {room.description}
                      </p>
                    </div>
                  ))}
                </div>
                {rooms.length > 6 && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-3">
                    +{rooms.length - 6} more room types available
                  </p>
                )}
                <div className="mt-6">
                  <BookHotelCTA
                    bookingUrl={accommodation.bookingUrl}
                    websiteUrl={accommodation.websiteUrl}
                    accommodationId={accommodation.id}
                    accommodationSlug={accommodation.slug}
                    sourceComponent="rooms_section"
                    size="md"
                    label="Book Now"
                  />
                </div>
              </section>
            )}

            {/* Dining */}
            {dining.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-6">
                  Dining
                </h2>
                {diningPhoto && (
                  <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-6">
                    <Image
                      src={diningPhoto.url}
                      alt={`Dining at ${accommodation.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 680px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="space-y-5">
                  {dining.map((d, i) => (
                    <div key={i}>
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-heading font-semibold text-lg">
                          {d.name}
                        </h3>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {d.type}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1 leading-relaxed">
                        {d.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <BookHotelCTA
                    bookingUrl={accommodation.bookingUrl}
                    websiteUrl={accommodation.websiteUrl}
                    accommodationId={accommodation.id}
                    accommodationSlug={accommodation.slug}
                    sourceComponent="dining_section"
                    size="md"
                    label="Book Now"
                  />
                </div>
              </section>
            )}

            {/* Spa & Wellness */}
            {spa && spa.description && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-6">
                  {spa.name || "Spa & Wellness"}
                </h2>
                {spaPhoto && (
                  <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-6">
                    <Image
                      src={spaPhoto.url}
                      alt={`${spa.name || "Spa"} at ${accommodation.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 680px"
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  {spa.description}
                  {spa.highlights.length > 0 &&
                    ` Highlights include ${spa.highlights.join(", ").toLowerCase()}.`}
                </p>
              </section>
            )}

            {/* Activities & Experiences */}
            {activities.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-6">
                  Activities & Experiences
                </h2>
                <div className="space-y-4">
                  {activities.map((a, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
                    >
                      <h3 className="font-heading font-semibold text-lg">
                        {a.name}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed">
                        {a.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <BookHotelCTA
                    bookingUrl={accommodation.bookingUrl}
                    websiteUrl={accommodation.websiteUrl}
                    accommodationId={accommodation.id}
                    accommodationSlug={accommodation.slug}
                    sourceComponent="activities_section"
                    size="md"
                    label="Book Now"
                  />
                </div>
              </section>
            )}

            {/* Children's Amenities */}
            {childrenAmenities.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  Family Amenities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {childrenAmenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-[var(--muted)] px-3 py-1.5 text-sm font-medium"
                    >
                      {a}
                    </span>
                  ))}
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
                      className="rounded-full bg-[var(--muted)] px-3 py-1.5 text-sm font-medium"
                    >
                      {wineFeatureLabels[f] || f}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Insider Tips */}
            {accommodation.beforeYouBook && (
              <section>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  Insider Tips
                </h2>
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  {accommodation.beforeYouBook}
                </p>
              </section>
            )}

            {/* About (full description) */}
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
                        <span className="absolute top-2 left-2 z-10 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
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
          <aside className="lg:col-span-1 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:scrollbar-none">
            <div className="space-y-6">
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

      {/* Disclaimer */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-4">
        <p className="text-xs text-[var(--muted-foreground)] italic">
          Information on this page is sourced from public data and the
          property&apos;s website. Room types, dining options, and amenities may
          change — contact {accommodation.name} directly to confirm current
          offerings and availability. This page may contain affiliate links. If
          you book through our links, we may earn a small commission at no
          extra cost to you.
        </p>
      </div>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-10">
          <h2 className="font-heading text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <FAQSection faqs={faqs} />

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.answer,
                  },
                })),
              }),
            }}
          />
        </div>
      )}

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
            aggregateRating: accommodation.googleRating
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
