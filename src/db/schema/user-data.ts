import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { wineries } from "./wineries";

export const favorites = sqliteTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wineryId: integer("winery_id")
      .notNull()
      .references(() => wineries.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.wineryId] }),
    index("idx_favorites_user_id").on(t.userId),
  ]
);

export const visited = sqliteTable(
  "visited",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wineryId: integer("winery_id")
      .notNull()
      .references(() => wineries.id, { onDelete: "cascade" }),
    visitedDate: text("visited_date"),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.wineryId] }),
    index("idx_visited_user_id").on(t.userId),
  ]
);

export const wineryNotes = sqliteTable(
  "winery_notes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wineryId: integer("winery_id")
      .notNull()
      .references(() => wineries.id, { onDelete: "cascade" }),
    content: text("content"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.wineryId] })]
);
