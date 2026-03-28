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
 * Build a hotel booking URL with affiliate tracking.
 * If the accommodation has a direct bookingUrl (affiliate deep link), use it.
 * Otherwise fall back to the hotel's websiteUrl with UTM params.
 */
export function hotelBookingUrl(
  bookingUrl: string | null,
  websiteUrl: string | null
): string | null {
  const url = bookingUrl || websiteUrl;
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    if (!bookingUrl) {
      // Only add UTM params for direct website links (affiliate links have their own tracking)
      parsed.searchParams.set("utm_source", "napasonomaguide");
      parsed.searchParams.set("utm_medium", "affiliate");
      parsed.searchParams.set("utm_campaign", "hotel_booking");
    }
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
