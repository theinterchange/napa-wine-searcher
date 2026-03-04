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

export function wineryWinesUrl(wineryName: string): string | null {
  const affiliateId = process.env.NEXT_PUBLIC_NAPACABS_AFFILIATE_ID;
  if (!affiliateId) return null;

  const url = new URL("https://www.napacabs.com/search");
  url.searchParams.set("q", wineryName);
  url.searchParams.set("aff", affiliateId);
  return url.toString();
}
