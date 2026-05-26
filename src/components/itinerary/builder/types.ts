import type { TripOriginValue } from "../TripOriginInput";

export type Vibe =
  | "luxury"
  | "friends"
  | "bachelorette"
  | "celebration"
  | "romantic"
  | "casual";

export type Duration = "half" | "full" | "extended";

export type Valley = "" | "napa" | "sonoma";

/** Must-visit wineries the user has pinned — engine force-includes them via `anchorIds`. */
export interface AnchorWinery {
  id: number;
  name: string;
  subRegion: string | null;
}

export interface BuilderState {
  /** Step 1 */
  groupSize: number;
  withKids: boolean;
  withDogs: boolean;

  /** Step 2 — single-select. Multi-select over-constrained the winery pool; dogs/kids already live on Step 1. */
  vibe: Vibe | null;

  /** Step 3 */
  valley: Valley;
  /** Multi-select sub-regions, slugs only. Empty = no sub-region filter. */
  subRegions: Set<string>;

  /** Step 4 */
  duration: Duration;
  /** null = unset, true = user wants hotel help on the trip page, false = has lodging. */
  needsStay: boolean | null;
  origin: TripOriginValue | null;
  /** Free-text origin label when user typed something we couldn't map to coords. */
  originLabel: string;

  /** Step 5 */
  amenities: Set<string>;
  /** Wine-category preferences (multi-select). Soft signal: the generator
   *  scores wineries that produce these varietals higher rather than filtering
   *  others out, so picking a few doesn't shrink the pool. Keys match the
   *  WINE_CATEGORY_MAP labels in /api/routes/generate. */
  tastes: Set<string>;
  mustVisits: AnchorWinery[];
}

export const DEFAULT_STATE: BuilderState = {
  groupSize: 2,
  withKids: false,
  withDogs: false,
  vibe: null,
  valley: "",
  subRegions: new Set<string>(),
  duration: "full",
  needsStay: null,
  origin: null,
  originLabel: "",
  amenities: new Set<string>(),
  tastes: new Set<string>(),
  mustVisits: [],
};

/** Wine categories the trip generator understands. Keys must match
 *  WINE_CATEGORY_MAP in /api/routes/generate so the wineTypes URL param
 *  routes through correctly. Ordered loosely by popularity in the catalog. */
export const TASTE_OPTIONS: Array<{ id: string; label: string; blurb: string }> = [
  { id: "Cabernet Sauvignon", label: "Cabernet Sauvignon", blurb: "Big Napa reds — Bordeaux varietals." },
  { id: "Pinot Noir", label: "Pinot Noir", blurb: "Cool-climate elegance — Sonoma's signature." },
  { id: "Chardonnay", label: "Chardonnay", blurb: "Buttery to crisp; widely poured." },
  { id: "Sparkling", label: "Sparkling", blurb: "Bubbles — Carneros and Green Valley." },
  { id: "Rosé", label: "Rosé", blurb: "Dry, food-friendly, summer-leaning." },
  { id: "Zinfandel", label: "Zinfandel", blurb: "Bold reds, often Dry Creek-grown." },
  { id: "Red Blends", label: "Red Blends", blurb: "Merlot, Syrah, Petite Sirah, GSM." },
  { id: "White & Other", label: "White & Other", blurb: "Sauv Blanc, Viognier, Riesling, etc." },
];

export const STEP_TITLES = [
  "Who's going",
  "Vibe",
  "Region",
  "When",
  "Preferences",
] as const;

export const STEP_HINTS = [
  "So we recommend wineries that match your group.",
  "The one that best fits your day.",
  "Narrow it down, or keep the whole map in play.",
  "How much time you have, and whether you need a room.",
  "Last stop. Pin any must-visits or tweak filters.",
] as const;
