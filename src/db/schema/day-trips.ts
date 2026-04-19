import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { wineries } from "./wineries";

export const dayTripRoutes = sqliteTable("day_trip_routes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  region: text("region"),
  theme: text("theme"),
  estimatedHours: real("estimated_hours"),
  heroImageUrl: text("hero_image_url"),
  groupVibe: text("group_vibe"),
  duration: text("duration", { enum: ["half", "full", "weekend"] }),
  seoKeywords: text("seo_keywords"),
  faqJson: text("faq_json"),
  editorialPull: text("editorial_pull"),
  curatedAt: text("curated_at"),
});

export const dayTripStops = sqliteTable("day_trip_stops", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routeId: integer("route_id")
    .notNull()
    .references(() => dayTripRoutes.id, { onDelete: "cascade" }),
  wineryId: integer("winery_id")
    .notNull()
    .references(() => wineries.id, { onDelete: "cascade" }),
  stopOrder: integer("stop_order").notNull(),
  notes: text("notes"),
  suggestedDuration: integer("suggested_duration"),
  preComputedDriveMinutesToNext: real("pre_computed_drive_minutes_to_next"),
  preComputedMilesToNext: real("pre_computed_miles_to_next"),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  valleyVariant: text("valley_variant", {
    enum: ["napa", "sonoma", "both"],
  }).default("both"),
});
