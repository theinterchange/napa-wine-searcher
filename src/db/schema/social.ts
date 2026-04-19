import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const socialPosts = sqliteTable(
  "social_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entitySlug: text("entity_slug").notNull(),
    entityType: text("entity_type", {
      enum: ["winery", "accommodation"],
    }).notNull(),
    postType: text("post_type", {
      enum: ["spotlight", "roundup", "adults-only", "seasonal"],
    })
      .notNull()
      .default("spotlight"),

    // Variant: overlay (full-bleed) or bottom (photo + text area)
    variant: text("variant", { enum: ["overlay", "bottom"] })
      .notNull()
      .default("overlay"),

    // Format: ig (1080×1350) or pinterest (1000×1500)
    format: text("format", { enum: ["ig", "pinterest"] })
      .notNull()
      .default("ig"),

    // --- Editable overlay copy ---
    overlayHeadline: text("overlay_headline"),
    overlaySubtext: text("overlay_subtext"),
    // Tags stored as comma-separated: "Dog-friendly,Kid-friendly"
    overlayTags: text("overlay_tags"),

    // --- Editable captions (per channel) ---
    captionInstagram: text("caption_instagram"),
    captionPinterest: text("caption_pinterest"),

    // --- Photo selection + framing ---
    photoUrl: text("photo_url"),
    photoFocalX: real("photo_focal_x").default(50),
    photoFocalY: real("photo_focal_y").default(50),
    photoZoom: real("photo_zoom").default(1),

    // --- Publishing workflow ---
    status: text("status", {
      enum: ["draft", "approved", "queued", "posted", "failed"],
    })
      .notNull()
      .default("draft"),
    scheduledFor: text("scheduled_for"),
    postedAt: text("posted_at"),
    postUrl: text("post_url"),
    utmCampaign: text("utm_campaign"),

    // --- Rendered card URLs (Phase B: pre-render to Blob on approval) ---
    renderedCardIg: text("rendered_card_ig"),
    renderedCardPinterest: text("rendered_card_pinterest"),

    // --- Phase C: multi-slide (carousel + reel) ---
    // slides: JSON array of Slide objects. See src/lib/social/slide-types.ts.
    // Each slide has photoUrl, variant (hook|amenities|setting|experience|cta),
    // headline, optional body, optional amenities[], and which formats it targets.
    slides: text("slides", { mode: "json" }).$type<unknown>(),
    reelMp4Url: text("reel_mp4_url"),
    carouselZipUrl: text("carousel_zip_url"),

    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("idx_social_posts_slug").on(t.entitySlug, t.entityType),
    index("idx_social_posts_status").on(t.status),
  ]
);
