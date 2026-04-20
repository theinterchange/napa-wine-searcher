import { sqliteTable, text, integer, real, index, unique } from "drizzle-orm/sqlite-core";
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

// --- Page Impressions (client-side beacon) ---
// One row per page view. Batched by the client and written in groups to keep
// request count down. entityType/entityId are populated when the page is a
// known entity detail view (winery, accommodation, blog, guide, etc.) — the
// analytics dashboard joins on these to produce per-winery impression counts.
export const pageImpressions = sqliteTable(
  "page_impressions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    path: text("path").notNull(),
    pageType: text("page_type"),
    entityType: text("entity_type"),
    entityId: integer("entity_id"),
    wineryId: integer("winery_id"),
    accommodationId: integer("accommodation_id"),
    sessionId: text("session_id"),
    referrer: text("referrer"),
    durationMs: integer("duration_ms"),
    viewedAt: text("viewed_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("idx_page_impressions_path").on(t.path),
    index("idx_page_impressions_winery_id").on(t.wineryId),
    index("idx_page_impressions_accommodation_id").on(t.accommodationId),
    index("idx_page_impressions_viewed_at").on(t.viewedAt),
  ]
);

// --- GSC Daily Query Data (imported via Search Console API) ---
// One row per (date, page, query) tuple. Unique constraint prevents duplicate
// imports of the same day. Enables CTR analysis: appear vs. click on search.
export const gscDailyQueries = sqliteTable(
  "gsc_daily_queries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    page: text("page").notNull(),
    query: text("query").notNull(),
    impressions: integer("impressions").notNull(),
    clicks: integer("clicks").notNull(),
    ctr: real("ctr").notNull(),
    position: real("position").notNull(),
    fetchedAt: text("fetched_at").notNull(),
  },
  (t) => [
    index("idx_gsc_daily_date").on(t.date),
    index("idx_gsc_daily_page").on(t.page),
    unique("uniq_gsc_daily_date_page_query").on(t.date, t.page, t.query),
  ]
);

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
