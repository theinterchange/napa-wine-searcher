import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { wineries } from "./wineries";

export const tastingExperiences = sqliteTable("tasting_experiences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineryId: integer("winery_id")
    .notNull()
    .references(() => wineries.id),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price"),
  durationMinutes: integer("duration_minutes"),
  includes: text("includes"),
  reservationRequired: integer("reservation_required", { mode: "boolean" }).default(false),
  minGroupSize: integer("min_group_size"),
  maxGroupSize: integer("max_group_size"),
});
