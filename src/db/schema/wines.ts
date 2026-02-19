import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { wineries } from "./wineries";

export const wineTypes = sqliteTable("wine_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category", {
    enum: ["red", "white", "rosé", "sparkling", "dessert"],
  }).notNull(),
});

export const wines = sqliteTable("wines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineryId: integer("winery_id")
    .notNull()
    .references(() => wineries.id),
  wineTypeId: integer("wine_type_id").references(() => wineTypes.id),
  name: text("name").notNull(),
  vintage: integer("vintage"),
  price: real("price"),
  description: text("description"),
  rating: real("rating"),
  ratingSource: text("rating_source"),
  ratingCount: integer("rating_count"),
});
