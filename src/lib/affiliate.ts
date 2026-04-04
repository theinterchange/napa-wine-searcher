/**
 * Affiliate URL builders.
 * Return null when the corresponding env var is not set,
 * so UI components gracefully hide the link.
 */

export function wineSearchUrl(
  wineryName: string,
  wineName?: string,
  vintage?: number | null
): string | null {
  const affiliateId = process.env.NEXT_PUBLIC_WINE_COM_AFFILIATE_ID;
  if (!affiliateId) return null;

  const query = [wineryName, wineName, vintage].filter(Boolean).join(" ");
  const url = new URL("https://www.wine.com/search");
  url.searchParams.set("query", query);
  url.searchParams.set("ref", affiliateId);
  return url.toString();
}

/**
 * Build a Stay22 Allez deep link for a specific property.
 * Returns null when the affiliate ID env var is not set.
 */
export function stay22BookingUrl(
  name: string,
  lat: number,
  lng: number
): string | null {
  const affiliateId = process.env.NEXT_PUBLIC_STAY22_AFFILIATE_ID;
  if (!affiliateId) return null;

  const url = new URL("https://www.stay22.com/allez/roam");
  url.searchParams.set("aid", affiliateId);
  url.searchParams.set("hotelname", name);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  return url.toString();
}

/**
 * Build a hotel booking URL with affiliate tracking.
 * Priority: direct bookingUrl → Stay22 Allez link → websiteUrl with UTM params.
 */
export function hotelBookingUrl(
  bookingUrl: string | null,
  websiteUrl: string | null,
  stay22?: { name: string; lat: number; lng: number }
): string | null {
  // 1. Direct affiliate deep link from DB
  if (bookingUrl) {
    try {
      const parsed = new URL(bookingUrl);
      if (parsed.protocol === "http:") parsed.protocol = "https:";
      return parsed.toString();
    } catch {
      // fall through
    }
  }

  // 2. Stay22 Allez link (if we have coordinates)
  if (stay22) {
    const allez = stay22BookingUrl(stay22.name, stay22.lat, stay22.lng);
    if (allez) return allez;
  }

  // 3. Hotel website with UTM params
  if (!websiteUrl) return null;
  try {
    const parsed = new URL(websiteUrl);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    parsed.searchParams.set("utm_source", "napasonomaguide");
    parsed.searchParams.set("utm_medium", "affiliate");
    parsed.searchParams.set("utm_campaign", "hotel_booking");
    return parsed.toString();
  } catch {
    return null;
  }
}

export function wineryWinesUrl(wineryName: string): string | null {
  const affiliateId = process.env.NEXT_PUBLIC_NAPACABS_AFFILIATE_ID;
  if (!affiliateId) return null;

  const url = new URL("https://www.napacabs.com/search");
  url.searchParams.set("q", wineryName);
  url.searchParams.set("aff", affiliateId);
  return url.toString();
}
