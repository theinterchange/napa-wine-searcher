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

export const WINE_PRICE_TIERS = [
  { key: "under-25", label: "Under $25", min: 0, max: 25 },
  { key: "25-50", label: "$25 - $50", min: 25, max: 50 },
  { key: "50-100", label: "$50 - $100", min: 50, max: 100 },
  { key: "over-100", label: "$100+", min: 100, max: 99999 },
] as const;

export type TastingPriceTier = (typeof TASTING_PRICE_TIERS)[number]["key"];
export type WinePriceTier = (typeof WINE_PRICE_TIERS)[number]["key"];
