export const TASTING_PRICE_TIERS = [
  { key: "budget", label: "Budget", sublabel: "$0 - $40", min: 0, max: 40 },
  { key: "classic", label: "Classic", sublabel: "$41 - $75", min: 41, max: 75 },
  {
    key: "premium",
    label: "Premium",
    sublabel: "$76 - $125",
    min: 76,
    max: 125,
  },
  { key: "luxury", label: "Luxury", sublabel: "$125+", min: 126, max: 99999 },
] as const;

export type TastingPriceTier = (typeof TASTING_PRICE_TIERS)[number]["key"];

export const AMENITY_OPTIONS = [
  { value: "dog", label: "Dog Friendly" },
  { value: "kid", label: "Kid Friendly" },
  { value: "picnic", label: "Picnic Friendly" },
  { value: "walkin", label: "Walk-in Friendly" },
  { value: "sustainable", label: "Sustainable" },
] as const;
