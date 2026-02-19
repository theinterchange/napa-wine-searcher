import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { wines } from "./wines";
import { wineries } from "./wineries";

export const wineRatings = sqliteTable("wine_ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineId: integer("wine_id")
    .notNull()
    .references(() => wines.id),
  provider: text("provider").notNull(),
  score: real("score"),
  maxScore: real("max_score"),
  reviewCount: integer("review_count"),
  criticName: text("critic_name"),
  fetchedAt: text("fetched_at"),
});

export const wineryRatings = sqliteTable("winery_ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineryId: integer("winery_id")
    .notNull()
    .references(() => wineries.id),
  provider: text("provider").notNull(),
  score: real("score"),
  maxScore: real("max_score"),
  reviewCount: integer("review_count"),
  fetchedAt: text("fetched_at"),
});
