export type TripSource = "curated" | "saved" | "anonymous";

export type TripStop = {
  wineryId: number;
  slug: string;
  name: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  heroImageUrl: string | null;
  googleRating: number | null;
  aggregateRating: number | null;
  priceLevel: number | null;
  subRegion: string | null;
  subRegionSlug: string | null;
  valley: string | null;
  hoursJson: string | null;
  visitUrl: string | null;
  websiteUrl: string | null;
  dogFriendly: boolean | null;
  kidFriendly: boolean | null;
  picnicFriendly: boolean | null;
  sustainable: boolean | null;
  reservationRequired: boolean | null;
  dogFriendlySource: string | null;
  kidFriendlySource: string | null;
  picnicFriendlySource: string | null;
  sustainableSource: string | null;
  curated: boolean;
  /** True for stops the editorial team has pinned as featured / sponsored. Renders a Featured pill. */
  isFeatured: boolean;
  /** Which valley view this stop appears in. 'both' shows only in the Both toggle. */
  valleyVariant: "napa" | "sonoma" | "both";
  notes: string | null;
  suggestedDurationMinutes: number | null;
  tasting: { min: number | null; max: number | null } | null;
  tastingDurationMinutes: number;
  lastScrapedAt: string | null;
};

export type TripOrigin = {
  lat: number;
  lng: number;
  label: string | null;
} | null;

export type Trip = {
  id: number | null;
  shareCode: string | null;
  name: string;
  slug: string | null;
  forkedFromRouteId: number | null;
  theme: string | null;
  valley: string | null;
  groupVibe: string | null;
  duration: "half" | "full" | "weekend" | null;
  heroImageUrl: string | null;
  editorialPull: string | null;
  origin: TripOrigin;
  stops: TripStop[];
  /** Winery IDs in the original editorial (curator-defined) order. Present on curated trips and their forks so "Reset to editorial order" can restore it after reordering or origin-driven re-optimization. */
  editorialStopOrder: number[] | null;
  /** Which valley variants have at least one stop. Lets the toggle hide empty options. Present only on curated trips. */
  availableVariants: ("napa" | "sonoma" | "both")[] | null;
  /** Current active variant — which filtered stop list is displayed. */
  activeVariant: "napa" | "sonoma" | "both" | null;
  /** All curated stops across all variants, for in-memory toggle switching. Populated only on the curated detail page. */
  allCuratedStops: TripStop[] | null;
  source: TripSource;
  isEditable: boolean;
  lastScrapedAt: string | null;
};

export type TripMutation =
  | { type: "add_stop"; stop: TripStop; atIndex: number }
  | { type: "remove_stop"; wineryId: number }
  | { type: "swap_stop"; oldWineryId: number; newStop: TripStop }
  | { type: "reorder"; fromIndex: number; toIndex: number }
  | { type: "set_origin"; origin: TripOrigin }
  | { type: "reset_to_curated"; originalStops: TripStop[] };

export type TripMutationResult = {
  next: Trip;
  inverse: TripMutation | null;
};
