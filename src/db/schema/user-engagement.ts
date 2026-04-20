import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { wineries } from "./wineries";
import { wines } from "./wines";
import { accommodations } from "./accommodations";

// --- Want to Visit / Bucket List ---
export const wantToVisit = sqliteTable(
  "want_to_visit",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wineryId: integer("winery_id")
      .notNull()
      .references(() => wineries.id, { onDelete: "cascade" }),
    addedAt: text("added_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [primaryKey({ columns: [t.userId, t.wineryId] })]
);

// --- Wine Journal ---
export const wineJournalEntries = sqliteTable("wine_journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  wineId: integer("wine_id").references(() => wines.id, {
    onDelete: "set null",
  }),
  wineryId: integer("winery_id").references(() => wineries.id, {
    onDelete: "set null",
  }),
  entryType: text("entry_type").notNull().default("wine"),
  wineName: text("wine_name").notNull(),
  wineryName: text("winery_name"),
  vintage: integer("vintage"),
  rating: integer("rating"),
  tastingNotes: text("tasting_notes"),
  dateTried: text("date_tried").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// --- Saved Trip Plans ---
export const savedTrips = sqliteTable("saved_trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shareCode: text("share_code").unique(),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  theme: text("theme"),
  valley: text("valley"),
  forkedFromRouteId: integer("forked_from_route_id"),
  originLat: real("origin_lat"),
  originLng: real("origin_lng"),
  originLabel: text("origin_label"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (t) => [
  index("idx_saved_trips_user_id").on(t.userId),
]);

export const savedTripStops = sqliteTable("saved_trip_stops", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id")
    .notNull()
    .references(() => savedTrips.id, { onDelete: "cascade" }),
  wineryId: integer("winery_id")
    .notNull()
    .references(() => wineries.id, { onDelete: "cascade" }),
  stopOrder: integer("stop_order").notNull(),
  notes: text("notes"),
}, (t) => [
  index("idx_saved_trip_stops_trip_id").on(t.tripId),
]);

// --- Collections / Lists ---
export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  shareCode: text("share_code").unique(),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (t) => [
  index("idx_collections_user_id").on(t.userId),
]);

export const collectionItems = sqliteTable(
  "collection_items",
  {
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    wineryId: integer("winery_id")
      .notNull()
      .references(() => wineries.id, { onDelete: "cascade" }),
    addedAt: text("added_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    notes: text("notes"),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.wineryId] }),
    index("idx_collection_items_collection_id").on(t.collectionId),
  ]
);

// --- User Ratings (1-5 stars per user per entity) ---
export const userWineryRatings = sqliteTable(
  "user_winery_ratings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wineryId: integer("winery_id")
      .notNull()
      .references(() => wineries.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.wineryId] }),
    index("idx_user_winery_ratings_winery_id").on(t.wineryId),
  ]
);

export const userAccommodationRatings = sqliteTable(
  "user_accommodation_ratings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accommodationId: integer("accommodation_id")
      .notNull()
      .references(() => accommodations.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.accommodationId] }),
    index("idx_user_accom_ratings_accom_id").on(t.accommodationId),
  ]
);

// --- Friendships (schema only, UI deferred) ---
export const friendships = sqliteTable(
  "friendships",
  {
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "accepted", "declined", "blocked"],
    })
      .notNull()
      .default("pending"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [primaryKey({ columns: [t.requesterId, t.addresseeId] })]
);
