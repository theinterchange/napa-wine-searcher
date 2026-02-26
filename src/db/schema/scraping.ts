import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { wineries } from "./wineries";

export const wineryPhotos = sqliteTable("winery_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineryId: integer("winery_id")
    .notNull()
    .references(() => wineries.id),
  url: text("url").notNull(),
  source: text("source").notNull(), // "google_places" | "website"
  altText: text("alt_text"),
});

export const scrapeLog = sqliteTable("scrape_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineryId: integer("winery_id")
    .notNull()
    .references(() => wineries.id),
  scrapedAt: text("scraped_at").notNull(),
  status: text("status").notNull(), // "success" | "partial" | "failed"
  winesFound: integer("wines_found"),
  tastingsFound: integer("tastings_found"),
  contentHash: text("content_hash"),
  errorMessage: text("error_message"),
});
