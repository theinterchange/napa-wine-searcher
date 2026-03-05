import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { wineries } from "./wineries";
import { wines } from "./wines";

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
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

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
});

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
});

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
  (t) => [primaryKey({ columns: [t.collectionId, t.wineryId] })]
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
