import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { wineries } from "./wineries";

export const outboundClicks = sqliteTable("outbound_clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineryId: integer("winery_id").references(() => wineries.id),
  clickType: text("click_type", {
    enum: ["website", "book_tasting", "buy_wine", "affiliate", "directions", "book_hotel"],
  }).notNull(),
  accommodationId: integer("accommodation_id"),
  destinationUrl: text("destination_url").notNull(),
  sourcePage: text("source_page"),
  sourceComponent: text("source_component"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const emailSubscribers = sqliteTable("email_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  source: text("source", {
    enum: [
      "itinerary",
      "guide",
      "exit_intent",
      "blog",
      "winery",
      "search",
      "homepage",
      "footer",
      "signup_direct",
    ],
  }).notNull(),
  subscribedAt: text("subscribed_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const pitchEmails = sqliteTable("pitch_emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineryId: integer("winery_id")
    .notNull()
    .references(() => wineries.id),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  sentAt: text("sent_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (t) => [
  index("idx_pitch_emails_winery_id").on(t.wineryId),
]);
