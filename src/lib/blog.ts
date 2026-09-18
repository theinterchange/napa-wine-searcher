import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPostEvent {
  name: string;
  eventType?: string;
  startDate: string;
  endDate: string;
  locationName: string;
  locationAddress: string;
  locationCity: string;
  locationRegion?: string;
  locationPostal?: string;
  url?: string;
  image?: string;
  /** Optional override for the JSON-LD description; falls back to post.description. */
  description?: string;
  /** MusicEvent performer name(s). Falls back to "Various Artists" when unset. */
  performer?: string;
  /** Organization that runs the event. Falls back to the event name. */
  organizer?: string;
  /** Ticket / registration URL (used to build the Offer). Falls back to event.url. */
  ticketUrl?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** Optional ISO date of the last meaningful revision. When set, drives the
   *  visible "Updated …" label (card + byline) and JSON-LD dateModified, while
   *  `date` stays the honest original publish date. */
  updated?: string;
  author: string;
  tags: string[];
  heroImage: string;
  content: string;
  event?: BlogPostEvent;
}

const BLOG_DIR = path.join(process.cwd(), "content/blog");

function readAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug: data.slug ?? file.replace(/\.mdx$/, ""),
        title: data.title ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
        updated: (data.updated as string | undefined) || undefined,
        author: data.author ?? "Napa Sonoma Guide",
        tags: data.tags ?? [],
        heroImage: data.heroImage ?? "",
        content,
        event: data.event as BlogPostEvent | undefined,
      } satisfies BlogPost;
    })
    .filter((post) => process.env.NODE_ENV === "development" || new Date(post.date) <= new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

let cached: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
  if (process.env.NODE_ENV === "development" || !cached) cached = readAllPosts();
  return cached;
}

/**
 * Recent posts for the 3-up "From the blog" modules, chosen for visual AND
 * topical variety so no module shows a cluster of near-identical cards.
 *
 * Two dedupe rules:
 *  - No two cards share the same hero image (several posts may reuse one hero).
 *  - No two cards share the same primary tag (tags[0]) — e.g. the three newest
 *    posts are all "dog-friendly"; without this the module would show three
 *    dog cards in a row even once their photos differ.
 *
 * This exists because the naive `getAllPosts().slice(0, 3)` surfaced the
 * dog-friendly cluster as three identical-looking cards on the homepage and
 * both region pages.
 *
 * `preferTag` (e.g. "napa valley") floats posts carrying that tag to the front
 * without breaking date order within each group, so region pages surface
 * region-relevant dispatches first.
 */
export function getRecentDistinctPosts(
  limit: number,
  preferTag?: string
): BlogPost[] {
  const all = getAllPosts(); // already newest-first
  const ordered = preferTag
    ? // Array.prototype.sort is stable in Node, so date order is preserved
      // within the "has tag" and "lacks tag" groups.
      [...all].sort(
        (a, b) =>
          (a.tags.includes(preferTag) ? 0 : 1) -
          (b.tags.includes(preferTag) ? 0 : 1)
      )
    : all;

  const seenImages = new Set<string>();
  const seenPrimaryTags = new Set<string>();
  const out: BlogPost[] = [];
  for (const post of ordered) {
    if (post.heroImage && seenImages.has(post.heroImage)) continue;
    const primaryTag = post.tags[0]?.toLowerCase();
    if (primaryTag && seenPrimaryTags.has(primaryTag)) continue;
    if (post.heroImage) seenImages.add(post.heroImage);
    if (primaryTag) seenPrimaryTags.add(primaryTag);
    out.push(post);
    if (out.length >= limit) break;
  }
  return out;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) tags.add(tag);
  }
  return Array.from(tags).sort();
}

/** Return all slugs including unpublished (for static generation). */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const { data } = matter(raw);
      return (data.slug as string) ?? file.replace(/\.mdx$/, "");
    });
}
