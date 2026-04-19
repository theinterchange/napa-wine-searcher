import { SUBREGION_CONTENT } from "./region-content";

// ============================================================
// Guide definitions — each entry produces one URL
// ============================================================

export interface GuideDefinition {
  slug: string;
  type: "amenity" | "varietal" | "price" | "comparison" | "experience";
  title: string;
  h1: string;
  metaDescription: string;
  intro: string[];
  faqs: { question: string; answer: string }[];
  // Filters used by the data layer
  amenity?: "dogFriendly" | "kidFriendly" | "picnicFriendly" | "walkIn";
  varietal?: string;
  priceTier?: "free" | "budget" | "mid" | "luxury";
  wineMaxPrice?: number;
  valley?: "napa" | "sonoma";
  subRegionSlug?: string;
  // Experience type (groups, first-time)
  experienceType?: "groups" | "first-time";
  // Comparison
  compare?: {
    region1: string; // valley or subregion slug
    region2: string;
    isValley: boolean;
  };
}

// ============================================================
// Region display names
// ============================================================

const REGION_NAMES: Record<string, string> = {
  napa: "Napa Valley",
  sonoma: "Sonoma County",
  calistoga: "Calistoga",
  "st-helena": "St. Helena",
  rutherford: "Rutherford",
  oakville: "Oakville",
  yountville: "Yountville",
  "stags-leap-district": "Stags Leap District",
  "atlas-peak": "Atlas Peak",
  "mount-veeder": "Mount Veeder",
  "carneros-napa": "Carneros (Napa)",
  "howell-mountain": "Howell Mountain",
  "russian-river-valley": "Russian River Valley",
  "sonoma-valley": "Sonoma Valley",
  "dry-creek-valley": "Dry Creek Valley",
  "alexander-valley": "Alexander Valley",
  "bennett-valley": "Bennett Valley",
  "carneros-sonoma": "Carneros (Sonoma)",
  "petaluma-gap": "Petaluma Gap",
};

function regionName(slug: string): string {
  return REGION_NAMES[slug] || slug;
}

// ============================================================
// SEO-optimized metaDescription generators (per type/subtype)
// ============================================================

const AMENITY_META: Record<string, (region: string) => string> = {
  dogFriendly: (r) => `Every confirmed dog-friendly winery in ${r} — outdoor patios, leash policies, and tips for tasting with your pup.`,
  kidFriendly: (r) => `Family-friendly wineries in ${r} with lawn games, grape juice, and outdoor spaces. Plan a wine country day the whole family enjoys.`,
  picnicFriendly: (r) => `The best picnic-friendly wineries in ${r}. Pack a lunch, spread a blanket, and sip wine with vineyard views.`,
  walkIn: (r) => `The best walk-in wineries in ${r} — no reservation required, with tasting fees, hours, and what to expect at each stop.`,
};

const PRICE_META: Record<string, (region: string) => string> = {
  free: (r) => `The best free wine tastings in ${r} — complimentary pours, fee-waiver tricks, and wineries that comp tastings with a bottle purchase.`,
  budget: (r) => `The best cheap wine tastings in ${r} — wineries under $40 with tasting fees, hours, and tips for waiving the fee with purchase.`,
  mid: (r) => `The best mid-range tastings ($40–80) in ${r}. Exceptional wines and intimate experiences at a sweet-spot price.`,
  luxury: (r) => `Worth-every-penny luxury tastings in ${r} — $100+ for private tours, rare wines, and unforgettable experiences.`,
};

// ============================================================
// Amenity intro content
// ============================================================

const AMENITY_INTROS: Record<string, (region: string) => string[]> = {
  dogFriendly: (region) => [
    `Planning a wine country trip with your four-legged friend? Many wineries in ${region} welcome well-behaved dogs, offering outdoor tasting areas, shaded patios, and even water bowls for your pup.`,
    `We've compiled every confirmed dog-friendly winery in ${region} so you can enjoy world-class wines without leaving your best friend behind. Policies vary — some allow dogs only on patios, others welcome them in tasting rooms — so always call ahead to confirm.`,
  ],
  kidFriendly: (region) => [
    `Wine tasting with kids doesn't have to mean a stressful experience. Several wineries in ${region} go out of their way to welcome families, with dedicated outdoor spaces, grape juice tastings, lawn games, and picnic areas.`,
    `Below you'll find wineries in ${region} that are confirmed kid-friendly. We recommend calling ahead to ask about specific accommodations, especially for younger children.`,
  ],
  picnicFriendly: (region) => [
    `Pack a picnic and pair it with world-class wine. These wineries in ${region} offer picnic grounds where you can spread out a blanket, enjoy local cheeses and charcuterie, and sip wines with vineyard views.`,
    `Picnic-friendly wineries are ideal for a relaxed afternoon in wine country. Many offer food for purchase on-site, while others encourage you to bring your own provisions.`,
  ],
  walkIn: (region) => [
    `Spontaneity is alive in wine country. While many wineries require reservations, these spots in ${region} welcome walk-in visitors — perfect for when you want to explore without a rigid schedule.`,
    `Walk-in friendly wineries tend to have a more casual, relaxed atmosphere. Drop by during weekday hours for the best chance of an unhurried tasting experience.`,
  ],
};

const AMENITY_FAQS: Record<string, (region: string) => { question: string; answer: string }[]> = {
  dogFriendly: (region) => [
    {
      question: `Are dogs allowed at wineries in ${region}?`,
      answer: `Yes, many wineries in ${region} welcome dogs, typically in outdoor tasting areas and patios. Policies vary by winery, so always call ahead. Dogs generally need to be leashed and well-behaved.`,
    },
    {
      question: `Which wineries in ${region} are the most dog-friendly?`,
      answer: `The wineries listed on this page have been confirmed as dog-friendly through direct research. Look for wineries with large outdoor patios and garden seating for the most dog-welcoming experiences.`,
    },
    {
      question: `Do I need to bring anything for my dog to wine country?`,
      answer: `Bring a leash, water bowl, poop bags, and a portable shade solution for hot days. Many wineries provide water bowls, but it's best to come prepared. Consider visiting during cooler months or earlier in the day during summer.`,
    },
  ],
  kidFriendly: (region) => [
    {
      question: `Can I bring kids to wineries in ${region}?`,
      answer: `Yes, several wineries in ${region} are kid-friendly and welcome families. Many offer outdoor spaces with lawn games, grape juice for young visitors, and picnic areas where kids can play while parents taste.`,
    },
    {
      question: `What age is appropriate for visiting wineries with kids?`,
      answer: `Wineries welcome visitors of all ages, though the experience is geared toward adults. For the best family experience, choose wineries with dedicated outdoor areas and plan shorter visits (30-45 minutes) to keep everyone comfortable.`,
    },
  ],
  picnicFriendly: (region) => [
    {
      question: `Which wineries in ${region} allow picnics?`,
      answer: `The wineries listed on this page offer picnic grounds or outdoor areas where you can enjoy your own food alongside their wines. Some also sell food on-site, including cheese, charcuterie, and seasonal dishes.`,
    },
    {
      question: `What should I bring for a winery picnic?`,
      answer: `A blanket or tablecloth, cheese, cured meats, bread, fresh fruit, and crackers pair well with wine country tastings. Don't forget sunscreen, a hat, and plenty of water. Many local delis and markets in ${region} sell ready-made picnic boxes.`,
    },
  ],
  walkIn: (region) => [
    {
      question: `Do all wineries in ${region} require reservations?`,
      answer: `No. While many wineries recommend or require reservations (especially on weekends), the wineries listed on this page accept walk-in visitors. Weekdays generally offer the best chance of a relaxed walk-in experience.`,
    },
    {
      question: `When is the best time to walk into a winery without a reservation?`,
      answer: `Weekday mornings (10-11 AM) and late afternoons (3-4 PM) tend to be the least crowded. Avoid weekend afternoons during peak season (September-October) when walk-in availability is most limited.`,
    },
  ],
};

// ============================================================
// Varietal intro content
// ============================================================

const VARIETAL_INTROS: Record<string, (region: string) => string[]> = {
  "Cabernet Sauvignon": (region) => [
    `Cabernet Sauvignon is the king of ${region}, producing some of the most acclaimed wines in the world. The region's combination of warm days, cool nights, and diverse soils creates Cabs of extraordinary depth, with flavors ranging from dark cassis and black cherry to cedar, tobacco, and chocolate.`,
    `Whether you're seeking a collector-grade bottle from a legendary estate or an approachable everyday Cab, ${region}'s wineries deliver across every price point. Explore the wineries below to find your next favorite Cabernet.`,
  ],
  "Pinot Noir": (region) => [
    `Pinot Noir thrives in the cooler corners of ${region}, where fog and maritime influence create the long, gentle growing season this finicky grape demands. The result is wines of remarkable elegance — bright cherry and raspberry fruit, silky tannins, and a complexity that unfolds with every sip.`,
    `From crisp and mineral-driven to rich and opulent, the Pinot Noirs of ${region} showcase an impressive range of styles. Visit the wineries below to discover the diversity of this beloved varietal.`,
  ],
  Chardonnay: (region) => [
    `Chardonnay is one of ${region}'s most versatile wines, ranging from lean and mineral-driven to rich and buttery depending on the winemaker's style and the vineyard's location. Cooler sites produce crisp, apple-and-citrus expressions, while warmer areas yield rounder, more tropical wines.`,
    `Explore ${region}'s best Chardonnay producers below and discover the full spectrum of this classic varietal.`,
  ],
  Zinfandel: (region) => [
    `Zinfandel has deep roots in ${region}, with some old-vine plantings dating back over a century. These gnarled, low-yielding vines produce wines of remarkable intensity — bursting with blackberry, pepper, and spice, with a warmth and richness that's distinctly Californian.`,
    `From jammy and bold to refined and structured, ${region}'s Zinfandels offer a rewarding exploration of one of California's signature grapes.`,
  ],
  Merlot: (region) => [
    `Merlot in ${region} produces plush, approachable wines with velvety tannins and flavors of plum, cherry, and cocoa. Often overshadowed by Cabernet Sauvignon, Merlot rewards those who seek it out with exceptional value and drinkability.`,
    `The wineries below showcase ${region}'s best Merlot producers, from elegant, Bordeaux-inspired blends to rich, single-varietal bottlings.`,
  ],
  "Sauvignon Blanc": (region) => [
    `Sauvignon Blanc in ${region} ranges from bright and grassy to rich and barrel-fermented, offering a refreshing counterpoint to the region's bold reds. It's the perfect wine for a warm afternoon on a tasting room patio.`,
    `Discover ${region}'s best Sauvignon Blanc producers below.`,
  ],
  "Red Blend": (region) => [
    `Red blends are where ${region}'s winemakers show their creativity, combining varietals like Cabernet Sauvignon, Merlot, Cabernet Franc, and Petit Verdot into wines that are often greater than the sum of their parts. Inspired by Bordeaux tradition but shaped by California's fruit-forward terroir, these blends range from structured and age-worthy to lush and immediately drinkable.`,
    `The wineries below are ${region}'s top red blend producers — explore their offerings to find bold, complex wines that showcase the art of blending.`,
  ],
  Rosé: (region) => [
    `Rosé has gone from afterthought to essential in ${region}, with top producers crafting dry, elegant rosés from Pinot Noir, Grenache, Mourvèdre, and even Cabernet Sauvignon. These aren't sweet blush wines — they're serious, food-friendly bottles with bright acidity and flavors of strawberry, watermelon, and citrus.`,
    `Whether you're looking for a crisp patio sipper or a rosé with the depth to pair with a meal, ${region}'s best rosé producers are worth seeking out.`,
  ],
  "Cabernet Franc": (region) => [
    `Cabernet Franc is the connoisseur's grape in ${region} — more aromatic and elegant than its offspring Cabernet Sauvignon, with signature notes of violets, red currant, and graphite. Often used as a blending component, the wineries below champion Cabernet Franc as a standalone varietal, producing wines of real distinction.`,
    `With only a handful of dedicated producers in the region, these Cab Franc specialists are worth seeking out for anyone who appreciates finesse over power.`,
  ],
  Syrah: (region) => [
    `Syrah in ${region} produces bold, peppery wines with dark fruit, smoked meat, and a savory complexity that sets it apart from the region's more common varietals. Thriving in both warm hillside vineyards and cooler coastal sites, Syrah rewards adventurous tasters with some of wine country's most exciting and underappreciated bottles.`,
    `The wineries below are ${region}'s standout Syrah producers — explore them for an alternative to the Cabernet and Pinot mainstream.`,
  ],
};

function getVarietalIntro(varietal: string, region: string): string[] {
  const generator = VARIETAL_INTROS[varietal];
  if (generator) return generator(region);
  return [
    `Discover the best ${varietal} producers in ${region}. The region's unique terroir and climate create wines of distinctive character and quality.`,
    `Explore the wineries below to find exceptional ${varietal} wines from ${region}'s top producers.`,
  ];
}

// ============================================================
// Price-based content
// ============================================================

const PRICE_INTROS: Record<string, (region: string) => string[]> = {
  free: (region) => [
    `Free wine tastings are a rare find in ${region}, but they do exist. Whether it's a complimentary tasting for members, a promotional event, or a winery that simply believes great wine should be accessible, these spots let you explore wine country without breaking the bank.`,
    `Note that free tasting availability may change — always confirm with the winery before visiting.`,
  ],
  budget: (region) => [
    `Wine tasting doesn't have to be expensive. These wineries in ${region} offer tastings for $40 or less — making them perfect for visitors who want to taste widely without splurging at every stop.`,
    `Many of these budget-friendly wineries offer excellent wines that rival their higher-priced neighbors. Some also waive the tasting fee with a wine purchase, making the visit essentially free.`,
  ],
  mid: (region) => [
    `The $40-80 tasting range hits a sweet spot in ${region}, where you'll find exceptional wines, knowledgeable hosts, and often more intimate experiences than the walk-in crowd. These wineries deliver outstanding value for the quality of the experience.`,
  ],
  luxury: (region) => [
    `For a truly special wine country experience, these luxury tastings in ${region} — priced at $100 and above — offer the best of everything: rare library wines, private vineyard tours, seated tastings with food pairings, and one-on-one time with winemakers.`,
    `These premium experiences are worth every penny for wine enthusiasts seeking something beyond the standard tasting bar.`,
  ],
};

// ============================================================
// Comparison content
// ============================================================

function getComparisonIntro(name1: string, name2: string): string[] {
  return [
    `Choosing between ${name1} and ${name2}? Both are world-class wine destinations, but they offer distinctly different experiences. This side-by-side comparison breaks down what makes each region unique — from grape varieties and tasting prices to atmosphere and amenities.`,
    `Whether you're planning a day trip or a longer wine country vacation, understanding the differences will help you choose the right destination for your palate and preferences.`,
  ];
}

// ============================================================
// Experience-based content (groups, first-time)
// ============================================================

const EXPERIENCE_INTROS: Record<string, (region: string) => string[]> = {
  groups: (region) => [
    `Planning a group wine tasting in ${region}? Whether it's a bachelorette party, birthday celebration, or friends' trip, the best group-friendly wineries offer walk-in availability, spacious tasting rooms, and a lively atmosphere that welcomes larger parties.`,
    `The wineries below welcome walk-in visitors, which means they're naturally set up for groups — no coordinating reservations for 10+ people. Many have outdoor patios, lawn games, and casual vibes perfect for celebrations.`,
  ],
  "first-time": (region) => [
    `First time visiting ${region} wine country? Welcome! Wine tasting is more approachable than you might think. The wineries below are perfect for beginners — they're walk-in friendly, affordably priced, and highly rated by other visitors.`,
    `Don't worry about knowing the "right" way to taste wine. These welcoming wineries have friendly staff who love introducing newcomers to wine country. Start here, and you'll quickly feel like a pro.`,
  ],
};

const EXPERIENCE_FAQS: Record<string, (region: string) => { question: string; answer: string }[]> = {
  groups: (region) => [
    {
      question: `What are the best wineries for groups in ${region}?`,
      answer: `The best group-friendly wineries in ${region} are walk-in friendly with spacious tasting rooms and outdoor areas. They accommodate larger parties without requiring advance reservations, making coordination easier. The wineries listed on this page are our top picks.`,
    },
    {
      question: `Do I need to book a limo or bus for group wine tasting?`,
      answer: `For groups of 6+, a wine tour shuttle, limo, or hired van is strongly recommended. It eliminates the need for a designated driver and many wineries look favorably on groups that arrive by professional transport. Expect to pay $50-150 per person for a full-day tour.`,
    },
    {
      question: `How many wineries can a group visit in a day?`,
      answer: `Most groups comfortably visit 3-4 wineries in a full day. Factor in travel time between stops (15-30 minutes), tasting time (45-60 minutes each), and a lunch break. Starting early (10-11 AM) gives you the most flexibility.`,
    },
  ],
  "first-time": (region) => [
    {
      question: `What should I know before my first wine tasting in ${region}?`,
      answer: `No experience needed! Wineries welcome beginners. Tastings typically last 30-60 minutes and include 4-6 wines. You'll receive small pours — it's perfectly fine to use the spit bucket or not finish every pour. Wear comfortable shoes and bring water.`,
    },
    {
      question: `How much does wine tasting cost in ${region}?`,
      answer: `Tasting fees in ${region} range from free to $150+, but most beginner-friendly wineries charge $25-50 per person. Many waive the tasting fee if you purchase a bottle, making the tasting essentially free.`,
    },
    {
      question: `What should I wear to a winery?`,
      answer: `Wine country casual is the norm — think smart casual. Comfortable shoes are important if you'll be walking through vineyards. Avoid strong perfumes or colognes as they interfere with wine aromas. Layers are smart since mornings can be cool and afternoons warm.`,
    },
    {
      question: `Do I need a reservation for wine tasting?`,
      answer: `It depends on the winery. The wineries on this page are all walk-in friendly, perfect for first-timers who want flexibility. For popular or premium wineries, reservations are often required — especially on weekends. Weekday visits generally offer the most relaxed experience.`,
    },
  ],
};

// ============================================================
// All guide definitions
// ============================================================

const AMENITY_TYPES = [
  { key: "dogFriendly" as const, slugPart: "dog-friendly-wineries", label: "Dog-Friendly Wineries", hasCluster: true },
  { key: "kidFriendly" as const, slugPart: "kid-friendly-wineries", label: "Kid-Friendly Wineries", hasCluster: true },
  { key: "picnicFriendly" as const, slugPart: "picnic-wineries", label: "Picnic-Friendly Wineries", hasCluster: false },
  { key: "walkIn" as const, slugPart: "walk-in-wineries", label: "Walk-In Wineries", hasCluster: false },
];

const VALLEYS = [
  { key: "napa" as const, slugPart: "napa-valley" },
  { key: "sonoma" as const, slugPart: "sonoma-county" },
];

const SUBREGIONS_WITH_VALLEY: { slug: string; valley: "napa" | "sonoma" }[] = [
  { slug: "calistoga", valley: "napa" },
  { slug: "st-helena", valley: "napa" },
  { slug: "rutherford", valley: "napa" },
  { slug: "oakville", valley: "napa" },
  { slug: "yountville", valley: "napa" },
  { slug: "stags-leap-district", valley: "napa" },
  { slug: "russian-river-valley", valley: "sonoma" },
  { slug: "sonoma-valley", valley: "sonoma" },
  { slug: "dry-creek-valley", valley: "sonoma" },
  { slug: "alexander-valley", valley: "sonoma" },
];

const VARIETALS = [
  "Cabernet Sauvignon",
  "Pinot Noir",
  "Chardonnay",
  "Zinfandel",
  "Merlot",
  "Sauvignon Blanc",
  "Red Blend",
  "Rosé",
  "Cabernet Franc",
  "Syrah",
];

export function getAllGuides(): GuideDefinition[] {
  const guides: GuideDefinition[] = [];

  // ---- Type 1: Amenity + Region ----
  // Skip amenity types that have dedicated category cluster pages
  // (dog-friendly → /dog-friendly-wineries/*, kid-friendly → /kid-friendly-wineries/*)
  for (const amenity of AMENITY_TYPES.filter((a) => !a.hasCluster)) {
    for (const valley of VALLEYS) {
      const region = regionName(valley.key);
      const slug = `${amenity.slugPart}-${valley.slugPart}`;
      guides.push({
        slug,
        type: "amenity",
        title: `${amenity.label} in ${region}`,
        h1: `${amenity.label} in ${region}`,
        metaDescription: AMENITY_META[amenity.key]?.(region) || `Find ${amenity.label.toLowerCase()} in ${region}. Browse verified listings with ratings, prices, and amenities.`,
        intro: AMENITY_INTROS[amenity.key]?.(region) || [],
        faqs: AMENITY_FAQS[amenity.key]?.(region) || [],
        amenity: amenity.key,
        valley: valley.key,
      });
    }

    // Sub-region amenity pages for popular combos
    for (const sr of SUBREGIONS_WITH_VALLEY) {
      const region = regionName(sr.slug);
      const slug = `${amenity.slugPart}-${sr.slug}`;
      guides.push({
        slug,
        type: "amenity",
        title: `${amenity.label} in ${region}`,
        h1: `${amenity.label} in ${region}`,
        metaDescription: AMENITY_META[amenity.key]?.(region) || `Find ${amenity.label.toLowerCase()} in ${region}. Browse verified listings with ratings, prices, and amenities.`,
        intro: AMENITY_INTROS[amenity.key]?.(region) || [],
        faqs: AMENITY_FAQS[amenity.key]?.(region) || [],
        amenity: amenity.key,
        valley: sr.valley,
        subRegionSlug: sr.slug,
      });
    }
  }

  // ---- Type 2: Varietal + Region ----
  for (const varietal of VARIETALS) {
    const varietalSlug = varietal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    for (const valley of VALLEYS) {
      const region = regionName(valley.key);
      const slug = `best-${varietalSlug}-${valley.slugPart}`;
      guides.push({
        slug,
        type: "varietal",
        title: `Best ${varietal} in ${region}`,
        h1: `Best ${varietal} in ${region}`,
        metaDescription: `The best ${varietal} in ${region} — top-rated producers with tasting fees, reservation info, and what makes each worth visiting.`,
        intro: getVarietalIntro(varietal, region),
        faqs: [
          {
            question: `What makes ${region} ${varietal} special?`,
            answer: `${region}'s unique combination of climate, soil, and elevation creates ideal conditions for ${varietal}. ${SUBREGION_CONTENT[Object.keys(SUBREGION_CONTENT).find(k => SUBREGIONS_WITH_VALLEY.find(s => s.slug === k && s.valley === valley.key)) || ""]?.terroir || "The diverse terroir produces wines of distinctive character."}`,
          },
          {
            question: `How much does a bottle of ${varietal} cost in ${region}?`,
            answer: `${varietal} prices in ${region} range widely — from $20-30 for everyday bottles to $200+ for premium, single-vineyard wines. Most quality ${varietal} from the region falls in the $40-80 range.`,
          },
        ],
        varietal,
        valley: valley.key,
      });
    }

    // Select key sub-regions for varietal pages
    const subRegionsForVarietal = SUBREGIONS_WITH_VALLEY.filter((sr) => {
      const content = SUBREGION_CONTENT[sr.slug];
      return content?.knownFor?.includes(varietal);
    });

    for (const sr of subRegionsForVarietal) {
      const region = regionName(sr.slug);
      const slug = `best-${varietalSlug}-${sr.slug}`;
      guides.push({
        slug,
        type: "varietal",
        title: `Best ${varietal} in ${region}`,
        h1: `Best ${varietal} in ${region}`,
        metaDescription: `The best ${varietal} in ${region} — top-rated producers with tasting fees, reservation info, and what makes each worth visiting.`,
        intro: getVarietalIntro(varietal, region),
        faqs: [],
        varietal,
        valley: sr.valley,
        subRegionSlug: sr.slug,
      });
    }
  }

  // ---- Type 3: Price-Based ----
  const priceTiers: { key: "free" | "budget" | "luxury"; slugPart: string; label: string; seoLabel?: string }[] = [
    { key: "free", slugPart: "free-wine-tastings", label: "Free Wine Tastings" },
    { key: "budget", slugPart: "cheap-wine-tastings", label: "Affordable Wine Tastings (Under $40)", seoLabel: "Cheap Wine Tastings Under $40" },
    { key: "luxury", slugPart: "luxury-wine-tasting-experiences", label: "Luxury Wine Tasting Experiences" },
  ];

  for (const tier of priceTiers) {
    for (const valley of VALLEYS) {
      const region = regionName(valley.key);
      const slug = `${tier.slugPart}-${valley.slugPart}`;
      guides.push({
        slug,
        type: "price",
        title: `${tier.seoLabel ?? tier.label} in ${region}`,
        h1: `${tier.label} in ${region}`,
        metaDescription: PRICE_META[tier.key]?.(region) || `Find ${tier.label.toLowerCase()} in ${region}. Browse wineries with pricing, ratings, and tasting details.`,
        intro: PRICE_INTROS[tier.key]?.(region) || [],
        faqs: [
          {
            question: `How much does a wine tasting cost in ${region}?`,
            answer: `Tasting fees in ${region} typically range from $25 to $150+. ${tier.key === "free" ? "Free tastings are rare but available at select wineries." : tier.key === "budget" ? "Budget-friendly options under $40 exist throughout the region." : "Luxury experiences start at $100 and include premium wines, food pairings, and private tours."}`,
          },
        ],
        priceTier: tier.key,
        valley: valley.key,
      });
    }
  }

  // Wine price guides
  for (const valley of VALLEYS) {
    const region = regionName(valley.key);
    guides.push({
      slug: `wines-under-50-${valley.slugPart}`,
      type: "price",
      title: `Wines Under $50 in ${region}`,
      h1: `Wines Under $50 in ${region}`,
      metaDescription: `Find great wines under $50 from ${region} wineries. Browse affordable bottles with ratings and tasting notes.`,
      intro: [
        `You don't need to spend a fortune for excellent wine from ${region}. These wineries offer bottles priced under $50 that deliver outstanding quality and value.`,
        `From crisp whites to bold reds, there are fantastic wines at every price point. Explore the wineries below to find your next favorite affordable bottle.`,
      ],
      faqs: [],
      wineMaxPrice: 50,
      valley: valley.key,
    });
  }

  // ---- Type 4: Comparison ----
  guides.push({
    slug: "napa-valley-vs-sonoma-county",
    type: "comparison",
    title: "Napa Valley vs Sonoma County: Which Wine Region is Right for You?",
    h1: "Napa Valley vs Sonoma County",
    metaDescription: "Compare Napa Valley and Sonoma County side by side — wineries, tasting prices, top varietals, amenities, and atmosphere. Find your perfect wine country destination.",
    intro: getComparisonIntro("Napa Valley", "Sonoma County"),
    faqs: [
      {
        question: "Is Napa Valley or Sonoma County better for wine tasting?",
        answer: "Both are world-class. Napa is known for premium Cabernet Sauvignon and a more polished tasting experience, while Sonoma offers more diversity, lower prices, and a more laid-back atmosphere. Many visitors combine both in one trip.",
      },
      {
        question: "Which is cheaper, Napa or Sonoma?",
        answer: "Sonoma County is generally more affordable, with lower average tasting fees and wine prices. However, both regions offer options at every price point.",
      },
      {
        question: "Can you visit both Napa and Sonoma in one day?",
        answer: "Yes, though it's ambitious. The valleys are separated by the Mayacamas Mountains, with a 30-60 minute drive between them. For a day trip, plan 2 wineries in one valley and 1-2 in the other.",
      },
    ],
    compare: { region1: "napa", region2: "sonoma", isValley: true },
  });

  // Sub-region comparisons
  const subRegionComparisons = [
    ["oakville", "rutherford"],
    ["russian-river-valley", "dry-creek-valley"],
    ["st-helena", "calistoga"],
    ["alexander-valley", "sonoma-valley"],
  ];

  for (const [sr1, sr2] of subRegionComparisons) {
    const name1 = regionName(sr1);
    const name2 = regionName(sr2);
    guides.push({
      slug: `${sr1}-vs-${sr2}`,
      type: "comparison",
      title: `${name1} vs ${name2}: Wine Region Comparison`,
      h1: `${name1} vs ${name2}`,
      metaDescription: `Compare ${name1} and ${name2} side by side — wineries, tasting prices, top varietals, and more. Find the best wine region for your visit.`,
      intro: getComparisonIntro(name1, name2),
      faqs: [],
      compare: { region1: sr1, region2: sr2, isValley: false },
    });
  }

  // ---- Type 5: Experience-Based (groups, first-time) ----
  // Note: romantic guides were retired 2026-04-12 after an audit found
  // thematically-mismatched wineries (e.g., a garage-themed and a robot-
  // themed winery) surfacing at the top of small-pool subregion pages.
  // 301 redirects are wired in next.config.ts.

  // Groups & Celebrations — valleys + select sub-regions
  const groupSubRegions = ["yountville", "st-helena", "sonoma-valley", "russian-river-valley"];
  for (const valley of VALLEYS) {
    const region = regionName(valley.key);
    guides.push({
      slug: `wineries-for-groups-${valley.slugPart}`,
      type: "experience",
      title: `Best Wineries for Groups in ${region} | Bachelorette & Celebrations`,
      h1: `Best Wineries for Groups in ${region}`,
      metaDescription: `Find group-friendly wineries in ${region}. Perfect for bachelorette parties, birthdays, and celebrations — no reservations needed.`,
      intro: EXPERIENCE_INTROS.groups(region),
      faqs: EXPERIENCE_FAQS.groups(region),
      experienceType: "groups",
      valley: valley.key,
    });
  }
  for (const srSlug of groupSubRegions) {
    const sr = SUBREGIONS_WITH_VALLEY.find((s) => s.slug === srSlug);
    if (!sr) continue;
    const region = regionName(srSlug);
    guides.push({
      slug: `wineries-for-groups-${srSlug}`,
      type: "experience",
      title: `Best Wineries for Groups in ${region} | Bachelorette & Celebrations`,
      h1: `Best Wineries for Groups in ${region}`,
      metaDescription: `Find group-friendly wineries in ${region}. Perfect for bachelorette parties, birthdays, and celebrations — no reservations needed.`,
      intro: EXPERIENCE_INTROS.groups(region),
      faqs: EXPERIENCE_FAQS.groups(region),
      experienceType: "groups",
      valley: sr.valley,
      subRegionSlug: srSlug,
    });
  }

  // First-Time Visitor — valleys only
  for (const valley of VALLEYS) {
    const region = regionName(valley.key);
    guides.push({
      slug: `first-time-guide-${valley.slugPart}`,
      type: "experience",
      title: `First-Time Visitor Guide to ${region} | Wine Tasting for Beginners`,
      h1: `First-Time Visitor Guide to ${region}`,
      metaDescription: `New to ${region}? Our beginner's guide covers the best walk-in wineries, what to expect, costs, etiquette, and tips for first-time wine tasters.`,
      intro: EXPERIENCE_INTROS["first-time"](region),
      faqs: EXPERIENCE_FAQS["first-time"](region),
      experienceType: "first-time",
      valley: valley.key,
    });
  }

  return guides;
}

// Map from slug to guide definition
const guideLookup = new Map<string, GuideDefinition>();
for (const g of getAllGuides()) {
  guideLookup.set(g.slug, g);
}

export function getGuideBySlug(slug: string): GuideDefinition | undefined {
  return guideLookup.get(slug);
}
