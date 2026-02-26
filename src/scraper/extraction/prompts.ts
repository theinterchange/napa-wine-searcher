/**
 * LLM extraction prompts for wines, tastings, and winery info.
 */

export const WINE_TYPES = [
  "Cabernet Sauvignon",
  "Pinot Noir",
  "Merlot",
  "Zinfandel",
  "Syrah",
  "Cabernet Franc",
  "Petite Sirah",
  "Malbec",
  "Red Blend",
  "Chardonnay",
  "Sauvignon Blanc",
  "Viognier",
  "Riesling",
  "Pinot Grigio",
  "White Blend",
  "Rosé",
  "Brut",
  "Blanc de Blancs",
  "Sparkling Rosé",
  "Late Harvest",
] as const;

export function wineExtractionPrompt(wineryName: string): string {
  return `You are extracting wine data from ${wineryName}'s website.

Extract all current release wines. For each wine return:
- name: the full wine name (e.g., "Estate Cabernet Sauvignon 2021")
- wineType: must be one of: ${WINE_TYPES.join(", ")}. Pick the closest match. If it's a blend of red varieties, use "Red Blend". If it's a blend of white varieties, use "White Blend".
- vintage: the vintage year as an integer, or null if NV (non-vintage) or not specified
- price: the retail price in USD as a number, or null if not listed
- description: a brief description or tasting notes, or null if none provided

Rules:
- Only include wines currently for sale (not sold out, library, or archived)
- Do not include merchandise, gift cards, or non-wine products
- If the page shows a wine club or allocation-only wine, still include it but note it in the description
- If no wines are found on the page, return an empty array`;
}

export function tastingExtractionPrompt(wineryName: string): string {
  return `You are extracting tasting and visit experience data from ${wineryName}'s website.

Extract all tasting/visit experiences currently available. For each return:
- name: the experience name (e.g., "Estate Tasting", "Cave Tour & Tasting")
- description: what the experience includes and what to expect
- price: price per person in USD as a number, or null if not listed
- durationMinutes: duration in minutes as an integer, or null if not specified
- reservationRequired: true if reservation is required, false if walk-ins accepted

Rules:
- Only include experiences currently bookable (not seasonal/past events)
- If price is listed as a range (e.g., "$50-75"), use the lower price
- If the page mentions complimentary tasting, set price to 0
- If no tasting experiences are found, return an empty array`;
}

export function wineryInfoExtractionPrompt(wineryName: string): string {
  return `You are extracting winery information from ${wineryName}'s website.

Extract the following:
- description: 2-3 sentences about what makes this winery special, its history, or what visitors should know. Write in third person.
- shortDescription: a single sentence tagline about the winery
- hours: operating hours as a JSON object with keys: mon, tue, wed, thu, fri, sat, sun. Each value should be a time range like "10:00-17:00" or "Closed". Use null if hours aren't listed.
- phone: phone number in format "(XXX) XXX-XXXX" or null
- email: email address or null
- reservationRequired: true if the winery requires reservations for visits
- dogFriendly: true if dogs are explicitly welcomed
- picnicFriendly: true if picnic areas are available or mentioned

Rules:
- For description, focus on what's unique: winemaking philosophy, notable wines, estate features, views, history
- Do not make up information that isn't on the page
- Use null for any field you can't determine from the content`;
}
