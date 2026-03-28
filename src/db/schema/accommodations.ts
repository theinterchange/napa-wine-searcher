import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { subRegions, wineries } from "./wineries";

export const accommodations = sqliteTable(
  "accommodations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: text("type", {
      enum: ["hotel", "inn", "resort", "vacation_rental", "bed_and_breakfast"],
    }).notNull(),
    subRegionId: integer("sub_region_id").references(() => subRegions.id),
    valley: text("valley", { enum: ["napa", "sonoma"] }).notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    heroImageUrl: text("hero_image_url"),
    thumbnailUrl: text("thumbnail_url"),
    address: text("address"),
    city: text("city"),
    state: text("state").default("CA"),
    lat: real("lat"),
    lng: real("lng"),
    phone: text("phone"),
    websiteUrl: text("website_url"),
    bookingUrl: text("booking_url"),
    bookingProvider: text("booking_provider").default("booking_com"),
    priceTier: integer("price_tier"),
    priceRangeMin: integer("price_range_min"),
    priceRangeMax: integer("price_range_max"),
    amenitiesJson: text("amenities_json"),
    wineFeatures: text("wine_features"),
    whyStayHere: text("why_stay_here"),
    theSetting: text("the_setting"),
    theExperience: text("the_experience"),
    beforeYouBook: text("before_you_book"),
    bestFor: text("best_for"),
    bestForTags: text("best_for_tags"),
    whyThisHotel: text("why_this_hotel"),
    dogFriendly: integer("dog_friendly", { mode: "boolean" }).default(false),
    dogFriendlyNote: text("dog_friendly_note"),
    kidFriendly: integer("kid_friendly", { mode: "boolean" }).default(false),
    kidFriendlyNote: text("kid_friendly_note"),
    adultsOnly: integer("adults_only", { mode: "boolean" }).default(false),
    googleRating: real("google_rating"),
    googleReviewCount: integer("google_review_count"),
    googlePlaceId: text("google_place_id"),
    seasonalNote: text("seasonal_note"),
    nearbyDining: text("nearby_dining"),
    dataConfidence: text("data_confidence"),
    updatedAt: text("updated_at"),
  },
  (t) => [
    index("idx_accommodations_slug").on(t.slug),
    index("idx_accommodations_valley").on(t.valley),
    index("idx_accommodations_sub_region_id").on(t.subRegionId),
  ]
);

export const accommodationPhotos = sqliteTable(
  "accommodation_photos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    accommodationId: integer("accommodation_id")
      .notNull()
      .references(() => accommodations.id),
    photoUrl: text("photo_url"),
    blobUrl: text("blob_url"),
    caption: text("caption"),
    sortOrder: integer("sort_order").default(0),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("idx_accommodation_photos_accommodation_id").on(t.accommodationId),
  ]
);

export const accommodationNearbyWineries = sqliteTable(
  "accommodation_nearby_wineries",
  {
    accommodationId: integer("accommodation_id")
      .notNull()
      .references(() => accommodations.id),
    wineryId: integer("winery_id")
      .notNull()
      .references(() => wineries.id),
    distanceMiles: real("distance_miles"),
    driveMinutes: real("drive_minutes"),
  },
  (t) => [
    primaryKey({ columns: [t.accommodationId, t.wineryId] }),
  ]
);
