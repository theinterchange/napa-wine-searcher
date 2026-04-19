import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { wineries } from "./wineries";
import { dayTripRoutes } from "./day-trips";

export const anonymousTrips = sqliteTable(
  "anonymous_trips",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    shareCode: text("share_code").notNull().unique(),
    name: text("name"),
    theme: text("theme"),
    valley: text("valley"),
    forkedFromRouteId: integer("forked_from_route_id").references(
      () => dayTripRoutes.id,
      { onDelete: "set null" }
    ),
    originLat: real("origin_lat"),
    originLng: real("origin_lng"),
    originLabel: text("origin_label"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    lastViewedAt: text("last_viewed_at"),
  },
  (t) => [index("idx_anon_trips_share_code").on(t.shareCode)]
);

export const anonymousTripStops = sqliteTable(
  "anonymous_trip_stops",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => anonymousTrips.id, { onDelete: "cascade" }),
    wineryId: integer("winery_id")
      .notNull()
      .references(() => wineries.id, { onDelete: "cascade" }),
    stopOrder: integer("stop_order").notNull(),
    notes: text("notes"),
  },
  (t) => [index("idx_anon_trip_stops_trip_id").on(t.tripId)]
);

export const routeCache = sqliteTable(
  "route_cache",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cacheKey: text("cache_key").notNull().unique(),
    fromLat: real("from_lat").notNull(),
    fromLng: real("from_lng").notNull(),
    toLat: real("to_lat").notNull(),
    toLng: real("to_lng").notNull(),
    miles: real("miles").notNull(),
    minutes: real("minutes").notNull(),
    minRangeMinutes: real("min_range_minutes").notNull(),
    maxRangeMinutes: real("max_range_minutes").notNull(),
    source: text("source").notNull(),
    polylineEncoded: text("polyline_encoded"),
    computedAt: text("computed_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    expiresAt: text("expires_at"),
  },
  (t) => [index("idx_route_cache_key").on(t.cacheKey)]
);

export const itineraryAnalyticsEvents = sqliteTable(
  "itinerary_analytics_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventName: text("event_name").notNull(),
    tripId: integer("trip_id"),
    shareCode: text("share_code"),
    mode: text("mode"),
    payloadJson: text("payload_json"),
    sessionId: text("session_id"),
    userId: text("user_id"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("idx_itin_events_event_name").on(t.eventName),
    index("idx_itin_events_created_at").on(t.createdAt),
  ]
);
