/**
 * Editorial content for accommodation category landing pages.
 *
 * Currently covers dog-friendly hotels/inns/resorts only. A family-friendly
 * cluster was considered but removed 2026-04-12: accommodations default to
 * kid-welcoming unless flagged adults_only, so a dedicated page would be
 * misleading (~90% of hotels would qualify).
 *
 * Voice: third-person, warm but restrained, Condé Nast travel style.
 */
import type { AccommodationAmenity, Valley } from "@/lib/category-data";

export type AccommodationScopeKey = "hub" | `valley:${Valley}`;

export interface AccommodationCategoryMeta {
  title: string;
  description: string;
  h1: string;
  pathSegments: string[];
}

export interface AccommodationFaqItem {
  question: string;
  answer: string;
}

export function accommodationScopeKeyOf(
  scope: { kind: "hub" } | { kind: "valley"; valley: Valley }
): AccommodationScopeKey {
  if (scope.kind === "hub") return "hub";
  return `valley:${scope.valley}`;
}

// ────────────────────────────────────────────────────────────────────────────
// DOG-FRIENDLY HOTELS
// ────────────────────────────────────────────────────────────────────────────

const DOG_HOTEL_META: Record<AccommodationScopeKey, AccommodationCategoryMeta> = {
  hub: {
    title: "Dog-Friendly Hotels in Napa Valley & Sonoma County (2026 Guide)",
    description: "Pet-welcoming hotels, inns, and resorts across Napa and Sonoma — properties that genuinely welcome dogs, not just tolerate them. Browse with booking links at napasonomaguide.com.",
    h1: "Dog-Friendly Hotels in Napa Valley & Sonoma County",
    pathSegments: [],
  },
  "valley:napa": {
    title: "Dog-Friendly Hotels in Napa Valley (2026 Guide)",
    description: "Napa Valley hotels and inns that welcome dogs — from downtown boutiques to vineyard-view resorts along Highway 29. Pet fees, weight limits, and booking links.",
    h1: "Dog-Friendly Hotels in Napa Valley",
    pathSegments: ["napa-valley"],
  },
  "valley:sonoma": {
    title: "Dog-Friendly Hotels in Sonoma County (2026 Guide)",
    description: "Sonoma County's most dog-welcoming places to stay — country inns, vineyard resorts, and downtown Healdsburg boutiques where four-legged guests are part of the plan.",
    h1: "Dog-Friendly Hotels in Sonoma County",
    pathSegments: ["sonoma-county"],
  },
};

const DOG_HOTEL_DECKS: Record<AccommodationScopeKey, string> = {
  hub:
    "Hotels, inns, and resorts across Napa and Sonoma that genuinely welcome dogs — with pet beds at turndown, treats at check-in, and walking trails out the back door.",
  "valley:napa":
    "From downtown Napa boutiques to Calistoga hot-springs resorts — the Napa Valley properties where your dog is a guest, not an exception.",
  "valley:sonoma":
    "Country inns, vineyard resorts, and downtown Healdsburg boutiques — Sonoma's dog-friendly hospitality extends from the tasting room to the hotel lobby.",
};

const DOG_HOTEL_FAQS: AccommodationFaqItem[] = [
  {
    question: "Do all dog-friendly hotels charge a pet fee?",
    answer:
      "Most do. Pet fees in Napa and Sonoma typically range from $25 to $75 per night, though some smaller inns include pets at no extra charge. A few luxury properties charge $100+ per stay. The fee usually covers extra cleaning and may include pet amenities like beds, bowls, and treats. Check each property's listing for specific fees.",
  },
  {
    question: "Are there weight or breed restrictions at wine country hotels?",
    answer:
      "Some properties cap dog weight at 25–50 lbs, and a few restrict certain breeds. Smaller inns tend to be more flexible than corporate-managed hotels. Always confirm when booking — policies can change seasonally, and mentioning your dog's size upfront avoids surprises at check-in.",
  },
  {
    question: "Are dogs allowed in hotel common areas — lobbies, pools, restaurants?",
    answer:
      "It varies widely. Most dog-friendly properties allow leashed dogs in lobbies and outdoor areas. Pool access is rare. Restaurant access depends on whether dining is outdoors (usually allowed) or indoors (usually not). Some luxury resorts have designated pet-friendly zones separate from the main guest areas.",
  },
  {
    question: "What pet amenities do wine country hotels typically provide?",
    answer:
      "Many dog-friendly properties provide beds, water bowls, and waste bags at minimum. Higher-end resorts may offer treats at turndown, dog walking services, pet-sitting referrals, and curated lists of nearby dog-friendly wineries and hiking trails. Some have fenced outdoor areas for off-leash time.",
  },
  {
    question: "Can I leave my dog in the hotel room while wine tasting?",
    answer:
      "Most dog-friendly hotels allow dogs to be left in the room unattended, provided the dog is crated or well-behaved and quiet. Some properties require crating. A few luxury resorts offer pet-sitting or dog daycare partnerships. Check the hotel's policy when booking — barking complaints can result in the pet policy being revoked for your stay.",
  },
  {
    question: "Which wine country area is best for a trip with a dog?",
    answer:
      "Sonoma County generally offers more dog-friendly options — both hotels and wineries — with a more casual, outdoor-oriented atmosphere. The Russian River Valley and Healdsburg areas are particularly strong. In Napa, Calistoga and downtown Napa have the best concentration of pet-friendly lodging. Both valleys have excellent hiking trails for dogs.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Public lookup API
// ────────────────────────────────────────────────────────────────────────────

export function getAccommodationCategoryMeta(
  _amenity: AccommodationAmenity,
  scope: { kind: "hub" } | { kind: "valley"; valley: Valley }
): AccommodationCategoryMeta | null {
  const key = accommodationScopeKeyOf(scope);
  return DOG_HOTEL_META[key] ?? null;
}

export function getAccommodationCategoryDeck(
  _amenity: AccommodationAmenity,
  scope: { kind: "hub" } | { kind: "valley"; valley: Valley }
): string | null {
  const key = accommodationScopeKeyOf(scope);
  return DOG_HOTEL_DECKS[key] ?? null;
}

export function getAccommodationCategoryFaqs(
  _amenity: AccommodationAmenity
): AccommodationFaqItem[] {
  return DOG_HOTEL_FAQS;
}
