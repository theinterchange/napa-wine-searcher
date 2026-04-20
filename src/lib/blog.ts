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
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
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
