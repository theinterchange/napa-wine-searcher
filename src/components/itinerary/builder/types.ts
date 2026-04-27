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
  mustVisits: [],
};

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
