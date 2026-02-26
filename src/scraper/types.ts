// ---- Google Places / Winery List ----

export interface WineryTarget {
  name: string;
  slug: string;
  websiteUrl: string | null;
  valley: "napa" | "sonoma";
  subRegion: string | null;
  city: string | null;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  googleRating: number | null;
  googleReviewCount: number;
  googlePlaceId: string;
  googlePhotos: string[]; // photo reference strings
  rank: number;
}

// ---- URL Mapping ----

export interface WineryUrls {
  websiteUrl: string;
  winesUrl: string | null;
  tastingsUrl: string | null;
  aboutUrl: string | null;
  status: "mapped" | "needs-manual-review";
}

// ---- LLM Extraction Results ----

export interface ExtractedWine {
  name: string;
  wineType: string;
  vintage: number | null;
  price: number | null;
  description: string | null;
}

export interface ExtractedTasting {
  name: string;
  description: string | null;
  price: number | null;
  durationMinutes: number | null;
  reservationRequired: boolean;
}

export interface ExtractedWineryInfo {
  description: string | null;
  shortDescription: string | null;
  hours: Record<string, string | null> | null; // { mon: "10:00-17:00", ... }
  phone: string | null;
  email: string | null;
  reservationRequired: boolean;
  dogFriendly: boolean;
  picnicFriendly: boolean;
}

// ---- Full Pipeline Result ----

export interface WineryExtractionResult {
  slug: string;
  wines: ExtractedWine[];
  tastings: ExtractedTasting[];
  info: ExtractedWineryInfo;
  sourceUrls: {
    wines: string | null;
    tastings: string | null;
    about: string | null;
  };
  status: "success" | "partial" | "failed";
  errors: string[];
}

// ---- Pipeline Options ----

export interface PipelineOptions {
  winery?: string; // single winery slug
  limit?: number;
  dryRun?: boolean;
  force?: boolean;
  batchSize?: number;
}
