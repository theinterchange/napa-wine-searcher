// Curated winery data for 15 iconic Napa & Sonoma wineries.
// Sources: winery websites, public listings, well-known published data.
// Last verified: 2026-02 (prices/hours may shift — check winery sites before visiting).

export interface CuratedWineryData {
  name: string;
  slug: string;
  subRegionSlug: string;
  description: string;
  shortDescription: string;
  address: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  websiteUrl: string;
  hoursJson: string;
  reservationRequired: boolean;
  dogFriendly: boolean;
  picnicFriendly: boolean;
  priceLevel: number;
  curated: true;
  curatedAt: string;
  wines: {
    name: string;
    wineType: string;
    vintage: number;
    price: number;
    description: string;
    rating: number;
    ratingSource: string;
    ratingCount: number;
  }[];
  tastings: {
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
    includes: string;
    reservationRequired: boolean;
    minGroupSize: number;
    maxGroupSize: number;
  }[];
  ratings: {
    provider: string;
    score: number;
    maxScore: number;
    reviewCount: number;
  }[];
}

const CURATED_AT = "2026-02-19";

export const curatedWineries: CuratedWineryData[] = [
  // ── Opus One ──────────────────────────────────────────────
  {
    name: "Opus One",
    slug: "opus-one",
    subRegionSlug: "oakville",
    description:
      "The legendary Bordeaux-style blend born from the partnership of Robert Mondavi and Baron Philippe de Rothschild. Opus One produces a single wine each vintage — a Cabernet Sauvignon-dominant blend from Oakville estate vineyards. The striking architecture and meticulous winemaking make this one of Napa's most prestigious visits.",
    shortDescription: "Legendary Mondavi-Rothschild Bordeaux-style partnership.",
    address: "7900 St. Helena Highway",
    city: "Oakville",
    zip: "94562",
    lat: 38.4317,
    lng: -122.4078,
    phone: "(707) 944-9442",
    websiteUrl: "https://www.opusonewinery.com",
    hoursJson: JSON.stringify({
      mon: "10:00-15:30", tue: "10:00-15:30", wed: "10:00-15:30",
      thu: "10:00-15:30", fri: "10:00-15:30", sat: "10:00-15:30", sun: "10:00-15:30",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 4,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Opus One 2022", wineType: "Red Blend", vintage: 2022, price: 490, description: "A blend of Cabernet Sauvignon, Merlot, Cabernet Franc, Petit Verdot, and Malbec from Oakville estate vineyards. Opulent dark fruit, silk tannins, and extraordinary length.", rating: 4.5, ratingSource: "vivino", ratingCount: 4200 },
      { name: "Overture 2022", wineType: "Red Blend", vintage: 2022, price: 210, description: "A multi-vintage blend showcasing the diversity of Opus One's estate vineyards. Accessible and elegant, meant to be enjoyed upon release.", rating: 4.2, ratingSource: "vivino", ratingCount: 2100 },
    ],
    tastings: [
      { name: "Estate Tasting", description: "Seated tasting of the current vintage of Opus One with views of the estate vineyards.", price: 125, durationMinutes: 45, includes: "1 glass of current vintage Opus One", reservationRequired: true, minGroupSize: 1, maxGroupSize: 6 },
      { name: "Opus One Experience", description: "Guided experience featuring the current and a library vintage of Opus One in an intimate setting.", price: 200, durationMinutes: 75, includes: "2 vintages of Opus One, guided by an estate host", reservationRequired: true, minGroupSize: 2, maxGroupSize: 4 },
      { name: "Art of the Table", description: "An exclusive culinary and wine experience pairing Opus One with a multi-course menu.", price: 780, durationMinutes: 120, includes: "Multi-course meal with Opus One pairings", reservationRequired: true, minGroupSize: 2, maxGroupSize: 4 },
    ],
    ratings: [
      { provider: "vivino", score: 4.5, maxScore: 5, reviewCount: 8500 },
      { provider: "google", score: 4.7, maxScore: 5, reviewCount: 3200 },
    ],
  },

  // ── Robert Mondavi Winery ─────────────────────────────────
  {
    name: "Robert Mondavi Winery",
    slug: "robert-mondavi",
    subRegionSlug: "oakville",
    description:
      "The winery that pioneered modern Napa Valley winemaking. Founded in 1966 by Robert Mondavi, the iconic mission-style architecture and To Kalon Vineyard produce some of California's most celebrated wines. Note: the Oakville estate is currently closed for renovations until Spring 2026; tastings are hosted at Arch & Tower in downtown Napa.",
    shortDescription: "Pioneer of modern Napa Valley winemaking.",
    address: "7801 St. Helena Highway",
    city: "Oakville",
    zip: "94562",
    lat: 38.4300,
    lng: -122.4094,
    phone: "(888) 766-6328",
    websiteUrl: "https://www.robertmondaviwinery.com",
    hoursJson: JSON.stringify({
      mon: "10:00-17:00", tue: "10:00-17:00", wed: "10:00-17:00",
      thu: "10:00-17:00", fri: "10:00-17:00", sat: "10:00-17:00", sun: "10:00-17:00",
    }),
    reservationRequired: false,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 3,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "To Kalon Vineyard Cabernet Sauvignon 2021", wineType: "Cabernet Sauvignon", vintage: 2021, price: 200, description: "Flagship Cabernet from the legendary To Kalon Vineyard. Rich blackcurrant, cedar, and graphite with firm, fine-grained tannins.", rating: 4.4, ratingSource: "vivino", ratingCount: 1800 },
      { name: "Reserve Cabernet Sauvignon 2019", wineType: "Cabernet Sauvignon", vintage: 2019, price: 192, description: "A selection of the finest lots from Napa Valley. Deep, concentrated dark fruit with elegant structure and aging potential.", rating: 4.3, ratingSource: "vivino", ratingCount: 2500 },
      { name: "Napa Valley Cabernet Sauvignon 2022", wineType: "Cabernet Sauvignon", vintage: 2022, price: 44, description: "Classic Napa Cabernet with ripe cherry, plum, and hints of vanilla from oak aging. Approachable yet structured.", rating: 4.0, ratingSource: "vivino", ratingCount: 4500 },
      { name: "Fumé Blanc 2023", wineType: "Sauvignon Blanc", vintage: 2023, price: 36, description: "Mondavi's signature Sauvignon Blanc, the wine that made the varietal famous in California. Citrus, melon, and subtle herbaceous notes.", rating: 3.9, ratingSource: "vivino", ratingCount: 3200 },
      { name: "Napa Valley Chardonnay 2022", wineType: "Chardonnay", vintage: 2022, price: 30, description: "Balanced and elegant with apple, pear, and light oak. A versatile wine for any occasion.", rating: 3.9, ratingSource: "vivino", ratingCount: 2800 },
      { name: "Napa Valley Pinot Noir 2021", wineType: "Pinot Noir", vintage: 2021, price: 37, description: "Silky and aromatic with cherry, raspberry, and subtle earthy undertones.", rating: 3.8, ratingSource: "vivino", ratingCount: 1500 },
    ],
    tastings: [
      { name: "Napa Discovery Tour & Tasting", description: "Introduction to the Mondavi legacy with a guided tour and tasting of current releases.", price: 55, durationMinutes: 60, includes: "Guided tour, 3-4 wines", reservationRequired: true, minGroupSize: 1, maxGroupSize: 15 },
      { name: "Estate Experience", description: "In-depth exploration of the estate with a seated tasting of reserve wines.", price: 85, durationMinutes: 75, includes: "Estate tour, 4-5 premium wines", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "To Kalon Reserve Tasting", description: "Exclusive seated tasting featuring To Kalon Vineyard and reserve Cabernets.", price: 125, durationMinutes: 75, includes: "4-5 reserve wines including To Kalon Cabernet", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
    ],
    ratings: [
      { provider: "vivino", score: 4.2, maxScore: 5, reviewCount: 12000 },
      { provider: "google", score: 4.5, maxScore: 5, reviewCount: 8900 },
    ],
  },

  // ── Stag's Leap Wine Cellars ──────────────────────────────
  {
    name: "Stag's Leap Wine Cellars",
    slug: "stags-leap-wine-cellars",
    subRegionSlug: "stags-leap-district",
    description:
      "The legendary estate whose 1973 S.L.V. Cabernet Sauvignon triumphed at the 1976 Judgment of Paris, reshaping the global wine world. Today, CASK 23 and S.L.V. remain among Napa's most coveted Cabernets. The FAY Outlook & Vineyard visit offers panoramic views of the Stags Leap palisades.",
    shortDescription: "1976 Judgment of Paris winner.",
    address: "5766 Silverado Trail",
    city: "Napa",
    zip: "94558",
    lat: 38.3989,
    lng: -122.3356,
    phone: "(707) 261-6410",
    websiteUrl: "https://www.stagsleapwinecellars.com",
    hoursJson: JSON.stringify({
      mon: "10:00-16:30", tue: "10:00-16:30", wed: "10:00-16:30",
      thu: "10:00-16:30", fri: "10:00-16:30", sat: "10:00-16:30", sun: "10:00-16:30",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 4,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "CASK 23 Cabernet Sauvignon 2020", wineType: "Cabernet Sauvignon", vintage: 2020, price: 318, description: "The estate's flagship blend of SLV and FAY vineyards. Profound depth with blackberry, cassis, and a signature mineral finish from the volcanic soils.", rating: 4.5, ratingSource: "vivino", ratingCount: 1200 },
      { name: "S.L.V. Cabernet Sauvignon 2021", wineType: "Cabernet Sauvignon", vintage: 2021, price: 220, description: "From the vineyard that won the Judgment of Paris. Structured and age-worthy with dark plum, graphite, and fine tannins.", rating: 4.4, ratingSource: "vivino", ratingCount: 1800 },
      { name: "FAY Cabernet Sauvignon 2021", wineType: "Cabernet Sauvignon", vintage: 2021, price: 220, description: "Elegant and floral from Nathan Fay's original vineyard. Red fruit, violet, and silky tannins with beautiful poise.", rating: 4.3, ratingSource: "vivino", ratingCount: 1500 },
      { name: "ARTEMIS Cabernet Sauvignon 2022", wineType: "Cabernet Sauvignon", vintage: 2022, price: 72, description: "Napa Valley Cabernet blending fruit from the estate and select vineyards. Ripe cherry, mocha, and accessible tannins.", rating: 4.1, ratingSource: "vivino", ratingCount: 3500 },
      { name: "AVETA Sauvignon Blanc 2023", wineType: "Sauvignon Blanc", vintage: 2023, price: 34, description: "Bright and refreshing with citrus, white peach, and crisp acidity. A perfect patio wine.", rating: 3.9, ratingSource: "vivino", ratingCount: 1200 },
      { name: "KARIA Chardonnay 2023", wineType: "Chardonnay", vintage: 2023, price: 43, description: "Elegant Napa Chardonnay with apple, pear, and subtle oak. Balanced and food-friendly.", rating: 3.9, ratingSource: "vivino", ratingCount: 1000 },
    ],
    tastings: [
      { name: "Signature Tasting", description: "Seated tasting on the terrace featuring ARTEMIS, AVETA, and KARIA alongside an estate Cabernet.", price: 95, durationMinutes: 60, includes: "4 wines, seated terrace experience", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Estate Experience", description: "Walk through FAY Vineyard to the outlook with panoramic views, followed by a seated tasting of estate wines including S.L.V. and FAY.", price: 125, durationMinutes: 90, includes: "Vineyard walk, 5 wines including single-vineyard Cabernets", reservationRequired: true, minGroupSize: 2, maxGroupSize: 6 },
      { name: "Collector's Tasting", description: "Exclusive cellar visit and seated tasting featuring CASK 23 alongside library vintages.", price: 225, durationMinutes: 90, includes: "Cellar tour, CASK 23 plus 2 library wines", reservationRequired: true, minGroupSize: 2, maxGroupSize: 4 },
    ],
    ratings: [
      { provider: "vivino", score: 4.4, maxScore: 5, reviewCount: 5500 },
      { provider: "google", score: 4.7, maxScore: 5, reviewCount: 2800 },
    ],
  },

  // ── Silver Oak Cellars ────────────────────────────────────
  {
    name: "Silver Oak Cellars",
    slug: "silver-oak",
    subRegionSlug: "oakville",
    description:
      "Dedicated exclusively to Cabernet Sauvignon since 1972, Silver Oak ages every wine in American oak barrels for a distinctive vanilla and coconut character. The LEED Platinum Alexander Valley winery and the Oakville tasting room both offer memorable visits focused on the art of Cabernet.",
    shortDescription: "Cabernet Sauvignon specialists aged in American oak.",
    address: "915 Oakville Cross Road",
    city: "Oakville",
    zip: "94562",
    lat: 38.4297,
    lng: -122.4031,
    phone: "(707) 942-7022",
    websiteUrl: "https://www.silveroak.com",
    hoursJson: JSON.stringify({
      mon: "10:00-17:00", tue: "10:00-17:00", wed: "10:00-17:00",
      thu: "10:00-17:00", fri: "10:00-17:00", sat: "10:00-17:00", sun: "10:00-17:00",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 4,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Napa Valley Cabernet Sauvignon 2021", wineType: "Cabernet Sauvignon", vintage: 2021, price: 200, description: "Rich and velvety with cassis, dark cherry, and signature American oak vanilla. Aged 24 months in new American oak.", rating: 4.3, ratingSource: "vivino", ratingCount: 5200 },
      { name: "Alexander Valley Cabernet Sauvignon 2021", wineType: "Cabernet Sauvignon", vintage: 2021, price: 78, description: "Vibrant and fruit-forward with ripe plum, blackberry, and coconut from American oak aging. Approachable upon release.", rating: 4.2, ratingSource: "vivino", ratingCount: 7500 },
      { name: "Twomey Sauvignon Blanc 2024", wineType: "Sauvignon Blanc", vintage: 2024, price: 30, description: "Crisp and aromatic with grapefruit, Meyer lemon, and fresh herbs. Estate-grown from Napa Carneros.", rating: 3.9, ratingSource: "vivino", ratingCount: 1800 },
      { name: "Twomey Pinot Noir 2023", wineType: "Pinot Noir", vintage: 2023, price: 56, description: "Russian River Valley Pinot with cherry, raspberry, and subtle spice. Elegant and silky.", rating: 4.1, ratingSource: "vivino", ratingCount: 1500 },
    ],
    tastings: [
      { name: "The Silver Tour", description: "Guided tour and tasting of Silver Oak and Twomey current releases.", price: 60, durationMinutes: 45, includes: "Tour, 3-4 wines from Silver Oak and Twomey", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Silver Oak Tasting", description: "Guided seated tasting of Silver Oak Cabernets and select Twomey wines.", price: 65, durationMinutes: 45, includes: "4-5 wines, seated experience", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Vertical Tasting", description: "Explore aged Silver Oak Cabernets from the library alongside current releases.", price: 85, durationMinutes: 60, includes: "4 wines including library Cabernets", reservationRequired: true, minGroupSize: 2, maxGroupSize: 6 },
      { name: "Wine & Food Pairing", description: "Silver Oak wines paired with seasonal bites in an intimate setting.", price: 125, durationMinutes: 75, includes: "4 wines with paired bites", reservationRequired: true, minGroupSize: 2, maxGroupSize: 6 },
    ],
    ratings: [
      { provider: "vivino", score: 4.3, maxScore: 5, reviewCount: 15000 },
      { provider: "google", score: 4.6, maxScore: 5, reviewCount: 4200 },
    ],
  },

  // ── Chateau Montelena ─────────────────────────────────────
  {
    name: "Chateau Montelena",
    slug: "chateau-montelena",
    subRegionSlug: "calistoga",
    description:
      "The legendary estate that put California wine on the world stage when its 1973 Chardonnay won the 1976 Judgment of Paris. The stone castle dating to 1882, Jade Lake with Chinese gardens, and world-class wines make this one of Napa's most storied destinations.",
    shortDescription: "Historic estate famous for the 1976 Judgment of Paris.",
    address: "1429 Tubbs Lane",
    city: "Calistoga",
    zip: "94515",
    lat: 38.5867,
    lng: -122.6156,
    phone: "(707) 942-5105",
    websiteUrl: "https://www.montelena.com",
    hoursJson: JSON.stringify({
      mon: "09:30-16:00", tue: "09:30-16:00", wed: "09:30-16:00",
      thu: "09:30-16:00", fri: "09:30-16:00", sat: "09:30-16:00", sun: "09:30-16:00",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: true,
    priceLevel: 4,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Estate Cabernet Sauvignon 2021", wineType: "Cabernet Sauvignon", vintage: 2021, price: 200, description: "Flagship estate Cabernet from the rocky benchland of Calistoga. Concentrated dark fruit, tobacco, and firm tannic structure built for aging.", rating: 4.4, ratingSource: "vivino", ratingCount: 2800 },
      { name: "Napa Valley Cabernet Sauvignon 2022", wineType: "Cabernet Sauvignon", vintage: 2022, price: 85, description: "Classic Napa Cabernet with black cherry, cassis, and cocoa. More accessible than the Estate bottling.", rating: 4.1, ratingSource: "vivino", ratingCount: 3500 },
      { name: "Napa Valley Chardonnay 2023", wineType: "Chardonnay", vintage: 2023, price: 75, description: "The wine that won the Judgment of Paris. Crisp and mineral-driven, fermented in stainless steel with no malolactic — a California benchmark.", rating: 4.2, ratingSource: "vivino", ratingCount: 4200 },
      { name: "Estate Zinfandel 2022", wineType: "Zinfandel", vintage: 2022, price: 50, description: "Old-vine Zinfandel from Calistoga. Bold raspberry and pepper with a briary, rustic charm.", rating: 4.0, ratingSource: "vivino", ratingCount: 1200 },
      { name: "Potter Valley Riesling 2024", wineType: "Riesling", vintage: 2024, price: 45, description: "Off-dry Riesling with apricot, honey, and bright acidity. A Montelena signature since the 1970s.", rating: 4.0, ratingSource: "vivino", ratingCount: 800 },
      { name: "Napa Valley Sauvignon Blanc 2024", wineType: "Sauvignon Blanc", vintage: 2024, price: 50, description: "Crisp and vibrant with citrus, green apple, and fresh herbaceous notes. A refreshing Calistoga white.", rating: 3.9, ratingSource: "vivino", ratingCount: 400 },
    ],
    tastings: [
      { name: "Taste of Montelena", description: "Guided tasting in the historic stone chateau, featuring current release wines.", price: 65, durationMinutes: 45, includes: "5 wines, indoor seated experience", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Story Behind the Bottle", description: "In-depth tasting exploring the history and winemaking of Chateau Montelena.", price: 75, durationMinutes: 60, includes: "5 wines with historical narrative", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Estate Walking Tour", description: "Guided walk through the estate grounds and gardens followed by a seated tasting.", price: 85, durationMinutes: 90, includes: "Estate tour, 5 wines", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
      { name: "Vineyard Tour", description: "Behind-the-scenes vineyard tour exploring terroir and viticulture, with a seated tasting.", price: 110, durationMinutes: 90, includes: "Vineyard tour, 5 wines including Estate Cabernet", reservationRequired: true, minGroupSize: 2, maxGroupSize: 6 },
      { name: "Estate Collection", description: "Exclusive tasting featuring library vintages alongside the current Estate Cabernet.", price: 125, durationMinutes: 90, includes: "Estate tour, 4 wines including library Cabernet", reservationRequired: true, minGroupSize: 2, maxGroupSize: 6 },
      { name: "Explore Ageability", description: "Guided tasting exploring the aging potential of Montelena wines across multiple vintages.", price: 95, durationMinutes: 75, includes: "5 wines spanning multiple vintages", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
      { name: "Legacy in the Glass", description: "Premium tasting of library and reserve wines with an in-depth look at Montelena's legacy.", price: 300, durationMinutes: 90, includes: "4 library and reserve wines, private experience", reservationRequired: true, minGroupSize: 2, maxGroupSize: 6 },
    ],
    ratings: [
      { provider: "vivino", score: 4.3, maxScore: 5, reviewCount: 6500 },
      { provider: "google", score: 4.6, maxScore: 5, reviewCount: 4100 },
    ],
  },

  // ── Domaine Carneros ──────────────────────────────────────
  {
    name: "Domaine Carneros",
    slug: "domaine-carneros",
    subRegionSlug: "carneros-napa",
    description:
      "Taittinger's American chateau, modeled after the 18th-century Château de la Marquetterie in Champagne, producing exquisite méthode traditionnelle sparkling wines and Pinot Noir. The grand terrace overlooking Carneros vineyards is one of Napa's most photogenic tasting spots.",
    shortDescription: "Taittinger's elegant American sparkling wine chateau.",
    address: "1240 Duhig Road",
    city: "Napa",
    zip: "94558",
    lat: 38.2597,
    lng: -122.3639,
    phone: "(707) 257-0101",
    websiteUrl: "https://www.domainecarneros.com",
    hoursJson: JSON.stringify({
      mon: "10:00-17:30", tue: "10:00-17:30", wed: "10:00-17:30",
      thu: "10:00-17:30", fri: "10:00-17:30", sat: "10:00-17:30", sun: "10:00-17:30",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 3,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Le Rêve Blanc de Blancs 2017", wineType: "Blanc de Blancs", vintage: 2017, price: 129, description: "Flagship tête de cuvée sparkling wine. Elegant and complex with brioche, Meyer lemon, and fine persistent mousse.", rating: 4.3, ratingSource: "vivino", ratingCount: 1200 },
      { name: "Le Rêve Rosé 2019", wineType: "Sparkling Rosé", vintage: 2019, price: 150, description: "Prestige cuvée rosé with delicate salmon hue, red berry, cream, and extraordinary finesse.", rating: 4.2, ratingSource: "vivino", ratingCount: 400 },
      { name: "Blanc de Blancs 2021", wineType: "Blanc de Blancs", vintage: 2021, price: 66, description: "All Chardonnay sparkling with citrus, white flower, and creamy mousse. Elegant and complex.", rating: 4.1, ratingSource: "vivino", ratingCount: 1500 },
      { name: "Brut Rosé 2021", wineType: "Sparkling Rosé", vintage: 2021, price: 48, description: "Salmon-hued sparkling with fresh strawberry, cream, and a dry, elegant finish.", rating: 4.1, ratingSource: "vivino", ratingCount: 2800 },
      { name: "Blanc de Noir NV", wineType: "Brut", vintage: 0, price: 45, description: "Pinot Noir-driven sparkling with rich breadth, red fruit, and creamy texture.", rating: 4.0, ratingSource: "vivino", ratingCount: 1500 },
      { name: "Estate Brut Cuvée 2021", wineType: "Brut", vintage: 2021, price: 39, description: "Classic méthode traditionnelle from Chardonnay and Pinot Noir. Green apple, toast, and lively bubbles.", rating: 4.0, ratingSource: "vivino", ratingCount: 3500 },
      { name: "Famous Gate Pinot Noir 2022", wineType: "Pinot Noir", vintage: 2022, price: 95, description: "Reserve Pinot Noir from the estate's finest blocks. Complex with dark cherry, truffle, and spice.", rating: 4.2, ratingSource: "vivino", ratingCount: 600 },
      { name: "Estate Pinot Noir 2023", wineType: "Pinot Noir", vintage: 2023, price: 47, description: "Cool-climate Carneros Pinot Noir with cherry, pomegranate, and earthy spice.", rating: 4.0, ratingSource: "vivino", ratingCount: 1800 },
      { name: "Avant-Garde Pinot Noir 2023", wineType: "Pinot Noir", vintage: 2023, price: 37, description: "Approachable Pinot Noir with bright red fruit and silky texture. Great everyday wine.", rating: 3.8, ratingSource: "vivino", ratingCount: 1500 },
    ],
    tastings: [
      { name: "Bubble Room Experience", description: "Seated table-service tasting on the terrace or in the salon, featuring sparkling wines and Pinot Noir.", price: 45, durationMinutes: 60, includes: "Flight of 5 wines, cheese plate", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Le Rêve Tasting", description: "Premium seated tasting featuring the flagship Le Rêve alongside reserve wines.", price: 85, durationMinutes: 75, includes: "5 wines including Le Rêve, paired bites", reservationRequired: true, minGroupSize: 2, maxGroupSize: 6 },
      { name: "Sparkling Wine & Caviar Pairing", description: "Indulgent pairing of estate sparkling wines with sustainably sourced caviar.", price: 125, durationMinutes: 60, includes: "3 sparkling wines, caviar service", reservationRequired: true, minGroupSize: 2, maxGroupSize: 4 },
    ],
    ratings: [
      { provider: "vivino", score: 4.1, maxScore: 5, reviewCount: 5000 },
      { provider: "google", score: 4.6, maxScore: 5, reviewCount: 7500 },
    ],
  },

  // ── Inglenook ─────────────────────────────────────────────
  {
    name: "Inglenook",
    slug: "inglenook",
    subRegionSlug: "rutherford",
    description:
      "Francis Ford Coppola's iconic Rutherford estate, originally founded in 1879 by Gustave Niebaum. The grand chateau, historic caves, and Rubicon — the estate's legendary Cabernet blend — represent the pinnacle of Rutherford winemaking. Fully restored to its 19th-century grandeur.",
    shortDescription: "Coppola's iconic estate producing legendary Rubicon.",
    address: "1991 St. Helena Highway",
    city: "Rutherford",
    zip: "94573",
    lat: 38.4628,
    lng: -122.4169,
    phone: "(707) 968-1161",
    websiteUrl: "https://www.inglenook.com",
    hoursJson: JSON.stringify({
      mon: "10:30-16:00", tue: "Closed", wed: "10:30-16:00",
      thu: "10:30-16:00", fri: "10:30-16:00", sat: "10:30-16:00", sun: "10:30-16:00",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 4,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Rubicon 2022", wineType: "Red Blend", vintage: 2022, price: 265, description: "The flagship estate Bordeaux blend, primarily Cabernet Sauvignon with Merlot, Cabernet Franc, and Petit Verdot. Dark fruit, mineral, and the famous Rutherford dust.", rating: 4.4, ratingSource: "vivino", ratingCount: 1500 },
      { name: "Cabernet Sauvignon 2022", wineType: "Cabernet Sauvignon", vintage: 2022, price: 100, description: "Estate Cabernet from Rutherford. Blackberry, cedar, and structured tannins.", rating: 4.1, ratingSource: "vivino", ratingCount: 1200 },
      { name: "Edizione Pennino Zinfandel 2020", wineType: "Zinfandel", vintage: 2020, price: 63, description: "Named for Coppola's grandfather. Bold and spicy with dark berry, pepper, and Italian heritage.", rating: 4.0, ratingSource: "vivino", ratingCount: 800 },
      { name: "Blancaneaux 2024", wineType: "White Blend", vintage: 2024, price: 65, description: "Rhône-style white blend of Viognier, Marsanne, and Roussanne. Aromatic with stone fruit and honeysuckle.", rating: 3.9, ratingSource: "vivino", ratingCount: 600 },
      { name: "RC Reserve Syrah 2019", wineType: "Syrah", vintage: 2019, price: 70, description: "Estate Syrah with dark plum, smoked meat, and black pepper. Rich and complex.", rating: 4.2, ratingSource: "vivino", ratingCount: 500 },
      { name: "Sauvignon Blanc 2023", wineType: "Sauvignon Blanc", vintage: 2023, price: 48, description: "Estate-grown Sauvignon Blanc with citrus, melon, and bright acidity. A refreshing Rutherford white.", rating: 3.9, ratingSource: "vivino", ratingCount: 300 },
    ],
    tastings: [
      { name: "Heritage Tasting", description: "Seated tasting in the historic chateau featuring estate wines and the story of Inglenook.", price: 75, durationMinutes: 45, includes: "4-5 estate wines, seated experience", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Legacy Tasting", description: "Walking tour through the historic chateau, barrel caves, and vineyards followed by a seated tasting of reserve wines.", price: 125, durationMinutes: 60, includes: "Full property tour, 5 wines including Rubicon", reservationRequired: true, minGroupSize: 2, maxGroupSize: 12 },
    ],
    ratings: [
      { provider: "vivino", score: 4.2, maxScore: 5, reviewCount: 4000 },
      { provider: "google", score: 4.6, maxScore: 5, reviewCount: 5200 },
    ],
  },

  // ── Caymus Vineyards ──────────────────────────────────────
  {
    name: "Caymus Vineyards",
    slug: "caymus-vineyards",
    subRegionSlug: "rutherford",
    description:
      "Founded in 1972 by Chuck Wagner, Caymus is renowned for its rich, opulent Cabernet Sauvignon — particularly the Special Selection, one of Napa's most collected wines. The Wagner family's focus on a single varietal has earned them cult status among Cabernet lovers.",
    shortDescription: "Iconic producer of highly sought Cabernet Sauvignon.",
    address: "8700 Conn Creek Road",
    city: "Rutherford",
    zip: "94573",
    lat: 38.4617,
    lng: -122.4250,
    phone: "(707) 967-3010",
    websiteUrl: "https://www.caymus.com",
    hoursJson: JSON.stringify({
      mon: "09:30-16:30", tue: "09:30-16:30", wed: "09:30-16:30",
      thu: "09:30-16:30", fri: "09:30-16:30", sat: "09:30-16:30", sun: "09:30-16:30",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 4,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Special Selection Cabernet Sauvignon 2019", wineType: "Cabernet Sauvignon", vintage: 2019, price: 225, description: "The crown jewel — a selection of the finest barrels. Deep, concentrated, and lush with dark chocolate, blackberry, and cashmere tannins.", rating: 4.5, ratingSource: "vivino", ratingCount: 3200 },
      { name: "Napa Valley Cabernet Sauvignon 2022", wineType: "Cabernet Sauvignon", vintage: 2022, price: 83, description: "Rich and ripe with dark fruit, cocoa, and vanilla. The signature Caymus style: bold, round, and immediately appealing.", rating: 4.3, ratingSource: "vivino", ratingCount: 12000 },
      { name: "Caymus-Suisun Grand Durif 2021", wineType: "Petite Sirah", vintage: 2021, price: 54, description: "From Suisun Valley. Inky and bold with blueberry, dark chocolate, and grippy tannins.", rating: 4.0, ratingSource: "vivino", ratingCount: 1800 },
    ],
    tastings: [
      { name: "Caymus Tasting", description: "Seated tasting of Caymus wines including current release and Special Selection Cabernets.", price: 50, durationMinutes: 90, includes: "3 wines including Special Selection", reservationRequired: true, minGroupSize: 1, maxGroupSize: 6 },
    ],
    ratings: [
      { provider: "vivino", score: 4.4, maxScore: 5, reviewCount: 18000 },
      { provider: "google", score: 4.5, maxScore: 5, reviewCount: 2500 },
    ],
  },

  // ── Schramsberg Vineyards ─────────────────────────────────
  {
    name: "Schramsberg Vineyards",
    slug: "schramsberg-vineyards",
    subRegionSlug: "calistoga",
    description:
      "America's premier sparkling wine house, founded in 1965 by Jack and Jamie Davies on an estate dating to 1862. Historic hand-dug caves house millions of bottles aging sur lie. Schramsberg has been served at White House state dinners since Nixon's 1972 'Toast to Peace' in Beijing.",
    shortDescription: "Premier sparkling wine house with historic caves.",
    address: "1400 Schramsberg Road",
    city: "Calistoga",
    zip: "94515",
    lat: 38.5722,
    lng: -122.5339,
    phone: "(707) 709-2469",
    websiteUrl: "https://www.schramsberg.com",
    hoursJson: JSON.stringify({
      mon: "09:00-16:30", tue: "09:00-16:30", wed: "09:00-16:30",
      thu: "09:00-16:30", fri: "09:00-16:30", sat: "09:00-16:30", sun: "09:00-16:30",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 3,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "J. Schram Blancs 2016", wineType: "Blanc de Blancs", vintage: 2016, price: 150, description: "The prestige cuvée — 100% Chardonnay aged 7+ years on the lees. Toasted brioche, lemon curd, and extraordinary complexity.", rating: 4.4, ratingSource: "vivino", ratingCount: 800 },
      { name: "Blanc de Blancs 2022", wineType: "Blanc de Blancs", vintage: 2022, price: 44, description: "All Chardonnay sparkling with green apple, citrus, and creamy mousse. A benchmark California sparkler.", rating: 4.1, ratingSource: "vivino", ratingCount: 2500 },
      { name: "Brut Rosé 2021", wineType: "Sparkling Rosé", vintage: 2021, price: 50, description: "Salmon-pink with raspberry, strawberry cream, and fine bubbles. Festive and elegant.", rating: 4.1, ratingSource: "vivino", ratingCount: 2000 },
      { name: "Blanc de Noirs 2022", wineType: "Brut", vintage: 2022, price: 46, description: "Pinot Noir-driven sparkling with rich breadth, red fruit, and creamy texture.", rating: 4.0, ratingSource: "vivino", ratingCount: 1500 },
      { name: "Mirabelle Brut NV", wineType: "Brut", vintage: 0, price: 33, description: "Approachable everyday sparkler with crisp apple, pear, and toasty notes. Excellent value from a premium house.", rating: 3.9, ratingSource: "vivino", ratingCount: 3500 },
    ],
    tastings: [
      { name: "All Sparkling Tasting", description: "Seated tasting of Schramsberg's sparkling wine portfolio.", price: 65, durationMinutes: 60, includes: "5 sparkling wines", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Cave Tour & Sparkling Tasting", description: "Tour the historic hand-dug caves dating to the 1800s, learn about méthode traditionnelle, and taste estate sparklers.", price: 90, durationMinutes: 75, includes: "Cave tour, 5 sparkling wines", reservationRequired: true, minGroupSize: 1, maxGroupSize: 16 },
      { name: "Cave Tour — Sparkling & Red", description: "Cave tour with an expanded tasting that includes both sparkling wines and Davies Vineyards reds.", price: 100, durationMinutes: 75, includes: "Cave tour, sparkling wines and red wines", reservationRequired: true, minGroupSize: 1, maxGroupSize: 16 },
      { name: "Custom Tasting Only", description: "Personalized tasting tailored to your preferences with guidance from a wine educator, without cave tour.", price: 85, durationMinutes: 45, includes: "5-6 wines selected by your host", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
      { name: "Custom Tasting", description: "Personalized cave tour and tasting tailored to your preferences with guidance from a wine educator.", price: 110, durationMinutes: 60, includes: "Cave tour, 5-6 wines selected by your host", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
      { name: "Sparkling & Red Tasting Only", description: "Seated tasting featuring both Schramsberg sparkling wines and Davies Vineyards reds.", price: 75, durationMinutes: 45, includes: "5 wines — sparkling and red", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Reserve & Cheese Pairing", description: "Elevated cave tour with an in-depth tasting of the J. Schram prestige cuvée alongside reserve bottlings and artisan cheese.", price: 140, durationMinutes: 90, includes: "Cave tour, 5 wines including J. Schram, cheese pairings", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
    ],
    ratings: [
      { provider: "vivino", score: 4.1, maxScore: 5, reviewCount: 4500 },
      { provider: "google", score: 4.7, maxScore: 5, reviewCount: 3800 },
    ],
  },

  // ── Domaine Chandon ───────────────────────────────────────
  {
    name: "Domaine Chandon",
    slug: "domaine-chandon",
    subRegionSlug: "yountville",
    description:
      "LVMH's California sparkling wine house, established in 1973 as the first French-owned sparkling wine venture in Napa. The stunning modern estate in Yountville features beautiful grounds, a restaurant, and an extensive range of still and sparkling wines.",
    shortDescription: "LVMH's elegant sparkling wine house.",
    address: "1 California Drive",
    city: "Yountville",
    zip: "94599",
    lat: 38.4256,
    lng: -122.3522,
    phone: "(707) 204-7461",
    websiteUrl: "https://www.chandon.com",
    hoursJson: JSON.stringify({
      mon: "10:00-16:00", tue: "10:00-16:00", wed: "10:00-16:00",
      thu: "10:00-16:00", fri: "10:00-16:00", sat: "10:00-16:00", sun: "10:00-16:00",
    }),
    reservationRequired: false,
    dogFriendly: false,
    picnicFriendly: true,
    priceLevel: 3,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Chandon Étoile Brut NV", wineType: "Brut", vintage: 0, price: 90, description: "Prestige cuvée with extended aging. Rich and complex with brioche, apple, and nutty notes.", rating: 4.1, ratingSource: "vivino", ratingCount: 1800 },
      { name: "Étoile Rosé NV", wineType: "Sparkling Rosé", vintage: 0, price: 95, description: "Prestige rosé cuvée with strawberry, cream, and elegant complexity. Extended aging on the lees.", rating: 4.2, ratingSource: "vivino", ratingCount: 600 },
      { name: "Chandon Brut NV", wineType: "Brut", vintage: 0, price: 28, description: "The signature sparkler — crisp green apple, pear, and fine bubbles. Widely available and consistently excellent.", rating: 3.8, ratingSource: "vivino", ratingCount: 8000 },
      { name: "Chandon Brut Rosé NV", wineType: "Sparkling Rosé", vintage: 0, price: 30, description: "Delicate pink sparkler with strawberry, peach, and a dry, refreshing finish.", rating: 3.9, ratingSource: "vivino", ratingCount: 5000 },
      { name: "Reserve Blanc de Blancs NV", wineType: "Blanc de Blancs", vintage: 0, price: 48, description: "All Chardonnay with citrus, white flower, and creamy mousse. Elegant and versatile.", rating: 3.9, ratingSource: "vivino", ratingCount: 2200 },
      { name: "Garden Spritz NV", wineType: "Sparkling Rosé", vintage: 0, price: 36, description: "A lighter, lower-alcohol sparkling with orange blossom, white peach, and a hint of bitterness. Aperitivo-style.", rating: 3.7, ratingSource: "vivino", ratingCount: 3000 },
      { name: "Chandon Sweet Star NV", wineType: "Brut", vintage: 0, price: 23, description: "Slightly sweet sparkling with ripe peach, mango, and tropical notes. Fun and festive.", rating: 3.6, ratingSource: "vivino", ratingCount: 2500 },
      { name: "Chardonnay Carneros 2020", wineType: "Chardonnay", vintage: 2020, price: 60, description: "Still Chardonnay from Carneros vineyards. Apple, pear, and subtle oak with bright acidity.", rating: 4.0, ratingSource: "vivino", ratingCount: 400 },
      { name: "Pinot Noir Carneros 2020", wineType: "Pinot Noir", vintage: 2020, price: 60, description: "Still Pinot Noir from cool-climate Carneros. Cherry, pomegranate, and earthy spice.", rating: 4.0, ratingSource: "vivino", ratingCount: 400 },
      { name: "Cabernet Sauvignon Yountville 2020", wineType: "Cabernet Sauvignon", vintage: 2020, price: 90, description: "Yountville Cabernet with dark cherry, cassis, and fine tannins. A departure from Chandon's sparkling heritage.", rating: 4.1, ratingSource: "vivino", ratingCount: 300 },
    ],
    tastings: [
      { name: "Weekday Wine Flight", description: "Casual seated tasting of sparkling and still wines on the terrace or salon.", price: 53, durationMinutes: 90, includes: "Flight of 4 wines", reservationRequired: false, minGroupSize: 1, maxGroupSize: 10 },
      { name: "Signature Tasting Flight", description: "Guided tasting of reserve and limited-production wines with a dedicated host.", price: 70, durationMinutes: 90, includes: "5 wines including reserve bottlings", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Pinnacle Tasting Flight", description: "Premium guided tasting featuring Étoile and top-tier cuvées in an intimate setting.", price: 95, durationMinutes: 90, includes: "5 wines including Étoile and prestige cuvées", reservationRequired: true, minGroupSize: 2, maxGroupSize: 6 },
      { name: "Fried Chicken & Fizz", description: "A fun pairing of Chandon sparkling wines with gourmet fried chicken bites.", price: 59, durationMinutes: 60, includes: "Sparkling wines paired with fried chicken courses", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
    ],
    ratings: [
      { provider: "vivino", score: 3.9, maxScore: 5, reviewCount: 20000 },
      { provider: "google", score: 4.5, maxScore: 5, reviewCount: 9500 },
    ],
  },

  // ── Williams Selyem ───────────────────────────────────────
  {
    name: "Williams Selyem",
    slug: "williams-selyem",
    subRegionSlug: "russian-river-valley",
    description:
      "One of California's most revered Pinot Noir producers, founded in 1981 by Burt Williams and Ed Selyem. Known for single-vineyard designations from legendary sites like Rochioli, Allen, and Hirsch. The mailing list has years-long waitlists. Tastings are available exclusively for active list members by appointment.",
    shortDescription: "Cult Pinot Noir producer with legendary waitlist.",
    address: "7227 Westside Road",
    city: "Healdsburg",
    zip: "95448",
    lat: 38.5475,
    lng: -122.8331,
    phone: "(707) 433-6425",
    websiteUrl: "https://www.williamsselyem.com",
    hoursJson: JSON.stringify({
      mon: "10:00-17:00", tue: "10:00-17:00", wed: "10:00-17:00",
      thu: "10:00-17:00", fri: "10:00-17:00", sat: "10:00-17:00", sun: "10:00-17:00",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 4,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Rochioli Riverblock Vineyard Pinot Noir 2023", wineType: "Pinot Noir", vintage: 2023, price: 110, description: "From a legendary vineyard block. Ethereal red cherry, rose petal, and forest floor with extraordinary finesse.", rating: 4.5, ratingSource: "vivino", ratingCount: 500 },
      { name: "Allen Vineyard Pinot Noir 2023", wineType: "Pinot Noir", vintage: 2023, price: 110, description: "Rich and concentrated from one of Russian River's finest vineyards. Dark cherry, cola, and savory spice.", rating: 4.4, ratingSource: "vivino", ratingCount: 600 },
      { name: "Westside Road Neighbors Pinot Noir 2024", wineType: "Pinot Noir", vintage: 2024, price: 90, description: "A multi-vineyard blend showcasing Russian River character. Bright cherry, cranberry, and earthy notes.", rating: 4.2, ratingSource: "vivino", ratingCount: 1200 },
      { name: "Sonoma Coast Pinot Noir 2024", wineType: "Pinot Noir", vintage: 2024, price: 70, description: "Cool-climate Pinot with red plum, wild strawberry, and coastal minerality.", rating: 4.1, ratingSource: "vivino", ratingCount: 1500 },
      { name: "Estate Vineyard Chardonnay 2023", wineType: "Chardonnay", vintage: 2023, price: 70, description: "Estate-grown Chardonnay with Burgundian elegance. Citrus, wet stone, and restrained oak.", rating: 4.2, ratingSource: "vivino", ratingCount: 800 },
      { name: "Drake Estate Vineyard Chardonnay 2024", wineType: "Chardonnay", vintage: 2024, price: 68, description: "Single-vineyard Chardonnay from a historic Russian River site. Meyer lemon, hazelnut, and beautiful acidity.", rating: 4.3, ratingSource: "vivino", ratingCount: 400 },
      { name: "Papera Vineyard Zinfandel 2024", wineType: "Zinfandel", vintage: 2024, price: 72, description: "Old-vine Russian River Zinfandel with boysenberry, pepper, and rustic charm.", rating: 4.1, ratingSource: "vivino", ratingCount: 500 },
    ],
    tastings: [
      { name: "Estate Tasting", description: "Seated tasting at the estate winery on Westside Road, featuring single-vineyard Pinot Noirs and Chardonnays. Available exclusively for active list members.", price: 75, durationMinutes: 60, includes: "5-6 wines, seated estate experience", reservationRequired: true, minGroupSize: 1, maxGroupSize: 6 },
      { name: "Vineyard Walk & Tasting", description: "Guided walk through the estate vineyard followed by a seated tasting of reserve wines. Active list members only.", price: 125, durationMinutes: 90, includes: "Vineyard tour, 6 wines including single-vineyard designations", reservationRequired: true, minGroupSize: 2, maxGroupSize: 6 },
    ],
    ratings: [
      { provider: "vivino", score: 4.3, maxScore: 5, reviewCount: 3500 },
      { provider: "google", score: 4.7, maxScore: 5, reviewCount: 1200 },
    ],
  },

  // ── Jordan Vineyard & Winery ──────────────────────────────
  {
    name: "Jordan Vineyard & Winery",
    slug: "jordan-winery",
    subRegionSlug: "alexander-valley",
    description:
      "A French-inspired chateau in Alexander Valley producing elegant Cabernet Sauvignon and Chardonnay since 1972. Founded by Tom and Sally Jordan, the estate emphasizes balance and restraint over power. The 1,200-acre property offers one of Sonoma's most memorable tasting experiences with estate tours, hikes, and seasonal food pairings.",
    shortDescription: "French-inspired chateau with elegant wines.",
    address: "1474 Alexander Valley Road",
    city: "Healdsburg",
    zip: "95448",
    lat: 38.6967,
    lng: -122.8744,
    phone: "(707) 431-5250",
    websiteUrl: "https://www.jordanwinery.com",
    hoursJson: JSON.stringify({
      mon: "08:00-16:30", tue: "08:00-16:30", wed: "08:00-16:30",
      thu: "08:00-16:30", fri: "08:00-16:30", sat: "09:00-15:30", sun: "09:00-15:30",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 3,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Alexander Valley Cabernet Sauvignon 2021", wineType: "Cabernet Sauvignon", vintage: 2021, price: 60, description: "Elegant and restrained Cabernet in the Bordeaux tradition. Blackberry, cedar, and dried herbs with supple tannins. Aged 12 months in French oak.", rating: 4.2, ratingSource: "vivino", ratingCount: 6500 },
      { name: "Russian River Valley Chardonnay 2023", wineType: "Chardonnay", vintage: 2023, price: 38, description: "Burgundy-inspired Chardonnay with apple, pear, and delicate oak. Bright acidity and clean finish.", rating: 4.0, ratingSource: "vivino", ratingCount: 4000 },
    ],
    tastings: [
      { name: "A Taste of Jordan", description: "Signature seated tasting of Jordan wines with seasonal food pairings.", price: 60, durationMinutes: 60, includes: "Jordan wines with paired bites", reservationRequired: true, minGroupSize: 1, maxGroupSize: 14 },
      { name: "Winery Tour & Tasting", description: "Guided tour of the chateau, vineyard, and production facilities followed by a seated tasting with food pairings.", price: 90, durationMinutes: 90, includes: "Estate tour, 4 wines, seasonal food pairings", reservationRequired: true, minGroupSize: 2, maxGroupSize: 14 },
      { name: "Chef's Terrace Tasting", description: "Seasonal al fresco tasting on the terrace with wines paired to chef-prepared courses.", price: 125, durationMinutes: 90, includes: "Terrace seating, wines with multi-course bites", reservationRequired: true, minGroupSize: 2, maxGroupSize: 14 },
      { name: "Estate Tour & Tasting", description: "Luxury wine tour of the breathtaking 1,200-acre Jordan Estate with food and wine pairing.", price: 170, durationMinutes: 120, includes: "Full estate tour, wines, seasonal chef's lunch", reservationRequired: true, minGroupSize: 2, maxGroupSize: 14 },
    ],
    ratings: [
      { provider: "vivino", score: 4.1, maxScore: 5, reviewCount: 9000 },
      { provider: "google", score: 4.7, maxScore: 5, reviewCount: 3500 },
    ],
  },

  // ── Gloria Ferrer Caves & Vineyards ───────────────────────
  {
    name: "Gloria Ferrer Caves & Vineyards",
    slug: "gloria-ferrer",
    subRegionSlug: "carneros-sonoma",
    description:
      "Founded in 1986 by the Ferrer family of Spain (Freixenet), Gloria Ferrer brings centuries of Catalan sparkling wine tradition to Sonoma's Carneros region. The hilltop terrace offers sweeping vineyard views, and the caves house thousands of bottles aging en tirage. One of Sonoma's best values for quality sparkling wine.",
    shortDescription: "Spanish sparkling house with Carneros views.",
    address: "23555 Arnold Drive",
    city: "Sonoma",
    zip: "95476",
    lat: 38.2414,
    lng: -122.4344,
    phone: "866-845-6742",
    websiteUrl: "https://www.gloriaferrer.com",
    hoursJson: JSON.stringify({
      mon: "10:00-17:00", tue: "Closed", wed: "10:00-17:00",
      thu: "10:00-17:00", fri: "10:00-17:00", sat: "10:00-17:00", sun: "10:00-17:00",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: false,
    priceLevel: 2,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Royal Cuvée Brut 2016", wineType: "Brut", vintage: 2016, price: 55, description: "Premium méthode traditionnelle with extended aging. Rich toast, green apple, and lemon zest with fine bubbles.", rating: 4.1, ratingSource: "vivino", ratingCount: 1200 },
      { name: "Sonoma Brut NV", wineType: "Brut", vintage: 0, price: 19, description: "Classic Carneros sparkling with crisp apple, pear, and a creamy finish. Outstanding value.", rating: 3.9, ratingSource: "vivino", ratingCount: 3000 },
      { name: "Blanc de Noirs NV", wineType: "Brut", vintage: 0, price: 24, description: "Pinot Noir-driven sparkling with strawberry, cherry, and bread dough richness.", rating: 3.9, ratingSource: "vivino", ratingCount: 1500 },
      { name: "Va de Vi Sparkling Rosé NV", wineType: "Sparkling Rosé", vintage: 0, price: 24, description: "Salmon-pink with fresh raspberry, citrus, and dry effervescence. Named for the Catalan toast 'It comes from wine.'", rating: 3.8, ratingSource: "vivino", ratingCount: 2000 },
      { name: "Carneros Pinot Noir 2022", wineType: "Pinot Noir", vintage: 2022, price: 24, description: "Cool-climate Pinot with cherry, earth, and gentle spice. Elegant and food-friendly.", rating: 3.9, ratingSource: "vivino", ratingCount: 1800 },
      { name: "Carneros Chardonnay 2021", wineType: "Chardonnay", vintage: 2021, price: 35, description: "Bright and clean with apple, citrus, and minimal oak. True Carneros character.", rating: 3.8, ratingSource: "vivino", ratingCount: 1200 },
    ],
    tastings: [
      { name: "Taste of Carneros", description: "Introductory tasting of estate sparkling wines and still wines on the terrace.", price: 62, durationMinutes: 45, includes: "4 wines, terrace seating", reservationRequired: false, minGroupSize: 1, maxGroupSize: 10 },
      { name: "Reserve Expedition", description: "Seated guided tasting exploring reserve and estate wines on the terrace with panoramic vineyard views.", price: 125, durationMinutes: 90, includes: "Flight of 5-6 reserve wines", reservationRequired: true, minGroupSize: 1, maxGroupSize: 7 },
      { name: "Culinary Journey", description: "Sparkling wines and Pinot Noir paired with seasonal culinary bites from the chef.", price: 130, durationMinutes: 90, includes: "Wines paired with seasonal courses", reservationRequired: true, minGroupSize: 1, maxGroupSize: 7 },
    ],
    ratings: [
      { provider: "vivino", score: 3.9, maxScore: 5, reviewCount: 5500 },
      { provider: "google", score: 4.5, maxScore: 5, reviewCount: 6000 },
    ],
  },

  // ── Ridge Vineyards (Lytton Springs) ──────────────────────
  {
    name: "Ridge Vineyards (Lytton Springs)",
    slug: "ridge-lytton-springs",
    subRegionSlug: "dry-creek-valley",
    description:
      "The Sonoma outpost of legendary Ridge Vineyards, home to the iconic Lytton Springs Zinfandel blend. Old-vine vineyards dating to the 1900s produce some of California's most profound and age-worthy Zinfandel-based wines. The tasting room offers appointment-based seated tastings — a pilgrimage site for Zinfandel lovers.",
    shortDescription: "Legendary producer of Lytton Springs Zinfandel.",
    address: "650 Lytton Springs Road",
    city: "Healdsburg",
    zip: "95448",
    lat: 38.6200,
    lng: -122.8633,
    phone: "(707) 433-7721",
    websiteUrl: "https://www.ridgewine.com",
    hoursJson: JSON.stringify({
      mon: "10:00-16:00", tue: "10:00-16:00", wed: "10:00-16:00",
      thu: "10:00-16:00", fri: "10:00-16:00", sat: "10:00-16:00", sun: "10:00-16:00",
    }),
    reservationRequired: true,
    dogFriendly: false,
    picnicFriendly: true,
    priceLevel: 3,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "Lytton Springs 2023", wineType: "Zinfandel", vintage: 2023, price: 55, description: "Flagship blend of old-vine Zinfandel, Petite Sirah, and Carignane from vines planted in the 1900s. Dark berry, pepper, and mineral with remarkable structure.", rating: 4.3, ratingSource: "vivino", ratingCount: 3500 },
      { name: "Geyserville 2023", wineType: "Red Blend", vintage: 2023, price: 55, description: "Alexander Valley field blend of Zinfandel, Carignane, and Petite Sirah. Bright fruit with spice and a long, silky finish.", rating: 4.2, ratingSource: "vivino", ratingCount: 2800 },
      { name: "Monte Bello 2022", wineType: "Cabernet Sauvignon", vintage: 2022, price: 310, description: "The flagship from Monte Bello Ridge (Santa Cruz). One of California's greatest Cabernets — structured, mineral, and built for decades.", rating: 4.6, ratingSource: "vivino", ratingCount: 1500 },
      { name: "Three Valleys 2023", wineType: "Zinfandel", vintage: 2023, price: 33, description: "Approachable Sonoma County Zinfandel blend. Bright raspberry, cherry, and peppery spice. Excellent everyday value.", rating: 4.0, ratingSource: "vivino", ratingCount: 4500 },
      { name: "Estate Chardonnay 2023", wineType: "Chardonnay", vintage: 2023, price: 75, description: "Monte Bello estate Chardonnay. Citrus, mineral, and restrained oak with beautiful acidity.", rating: 4.1, ratingSource: "vivino", ratingCount: 800 },
    ],
    tastings: [
      { name: "Estate Tasting", description: "Appointment-based seated tasting featuring single-vineyard wines from Sonoma County and the Santa Cruz Mountains.", price: 35, durationMinutes: 45, includes: "5 single-vineyard wines", reservationRequired: true, minGroupSize: 1, maxGroupSize: 8 },
      { name: "Beautiful Mountain: Monte Bello Cabernet Tasting", description: "Seated tasting featuring the Monte Bello Cabernet alongside Lytton Springs and Geyserville.", price: 75, durationMinutes: 45, includes: "4 wines including Monte Bello", reservationRequired: true, minGroupSize: 1, maxGroupSize: 6 },
      { name: "Century Tour & Library Tasting", description: "Guided tour of the historic vineyards and cellar followed by a tasting of library wines.", price: 65, durationMinutes: 60, includes: "Tour, 4 wines including library selections", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
      { name: "From Vine to Table", description: "Immersive food and wine pairing experience featuring Ridge wines with seasonal dishes.", price: 125, durationMinutes: 90, includes: "5 wines with paired seasonal courses", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
    ],
    ratings: [
      { provider: "vivino", score: 4.3, maxScore: 5, reviewCount: 7000 },
      { provider: "google", score: 4.6, maxScore: 5, reviewCount: 2200 },
    ],
  },

  // ── Buena Vista Winery ────────────────────────────────────
  {
    name: "Buena Vista Winery",
    slug: "buena-vista",
    subRegionSlug: "sonoma-valley",
    description:
      "California's oldest premium winery, founded in 1857 by Count Agoston Haraszthy, the 'Father of California Viticulture.' The historic stone cellars and press house in Sonoma are a state landmark. Now owned by Boisset Collection, Buena Vista combines 160+ years of history with approachable, well-priced wines.",
    shortDescription: "California's oldest premium winery since 1857.",
    address: "18000 Old Winery Road",
    city: "Sonoma",
    zip: "95476",
    lat: 38.2928,
    lng: -122.4564,
    phone: "800-926-1266",
    websiteUrl: "https://www.buenavistawinery.com",
    hoursJson: JSON.stringify({
      mon: "11:00-17:00", tue: "11:00-17:00", wed: "11:00-17:00",
      thu: "11:00-17:00", fri: "11:00-17:00", sat: "10:00-17:00", sun: "10:00-17:00",
    }),
    reservationRequired: false,
    dogFriendly: true,
    picnicFriendly: true,
    priceLevel: 2,
    curated: true,
    curatedAt: CURATED_AT,
    wines: [
      { name: "The Count Red Blend 2020", wineType: "Red Blend", vintage: 2020, price: 32, description: "Flagship blend honoring founder Count Haraszthy. Zinfandel-driven with Merlot and Syrah — rich dark fruit, mocha, and firm tannins.", rating: 4.0, ratingSource: "vivino", ratingCount: 800 },
      { name: "Sonoma Cabernet Sauvignon 2020", wineType: "Cabernet Sauvignon", vintage: 2020, price: 28, description: "Approachable Sonoma Cabernet with black cherry, plum, and soft oak. Great everyday red.", rating: 3.8, ratingSource: "vivino", ratingCount: 1500 },
      { name: "Carneros Chardonnay 2022", wineType: "Chardonnay", vintage: 2022, price: 24, description: "Bright and clean with green apple, pear, and subtle cream. Cool-climate Carneros character.", rating: 3.8, ratingSource: "vivino", ratingCount: 2000 },
      { name: "Carneros Pinot Noir 2021", wineType: "Pinot Noir", vintage: 2021, price: 37, description: "Elegant Pinot with cherry, strawberry, and earthy undertones. Excellent value.", rating: 3.8, ratingSource: "vivino", ratingCount: 1800 },
      { name: "North Coast Syrah 2020", wineType: "Syrah", vintage: 2020, price: 22, description: "Dark and savory with blackberry, smoked meat, and pepper. Approachable and well-priced.", rating: 3.7, ratingSource: "vivino", ratingCount: 900 },
      { name: "Sonoma Rosé 2023", wineType: "Rosé", vintage: 2023, price: 18, description: "Dry and refreshing with watermelon, citrus, and fresh herbs. Perfect patio wine.", rating: 3.7, ratingSource: "vivino", ratingCount: 600 },
    ],
    tastings: [
      { name: "Current Release Tasting", description: "Seated tasting in the historic press house featuring a curated selection of current release wines.", price: 35, durationMinutes: 45, includes: "4 wines, seated experience", reservationRequired: false, minGroupSize: 1, maxGroupSize: 10 },
      { name: "Barrel Tasting & Winery Tour", description: "Guided tour of the 1857 stone cellars and historic caves with barrel tasting, followed by a tasting of reserve wines.", price: 50, durationMinutes: 75, includes: "Winery tour, barrel tasting, 5 wines including reserve selections", reservationRequired: true, minGroupSize: 2, maxGroupSize: 12 },
      { name: "Private Experience", description: "Exclusive private tasting in the historic tasting room with wines paired to artisan cheeses and charcuterie.", price: 150, durationMinutes: 60, includes: "4 wines, cheese and charcuterie board, private setting", reservationRequired: true, minGroupSize: 2, maxGroupSize: 8 },
    ],
    ratings: [
      { provider: "vivino", score: 3.8, maxScore: 5, reviewCount: 5000 },
      { provider: "google", score: 4.4, maxScore: 5, reviewCount: 5500 },
    ],
  },
];
