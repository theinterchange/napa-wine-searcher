import { db } from "@/db";
import { socialPosts } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Wine, BedDouble, Pencil } from "lucide-react";

type PostStatus = "draft" | "approved" | "queued" | "posted" | "failed";

const statusColors: Record<PostStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  approved: "bg-green-100 text-green-700",
  queued: "bg-blue-100 text-blue-700",
  posted: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

export default async function SocialQueuePage() {
  const [posts, statusCounts] = await Promise.all([
    db
      .select()
      .from(socialPosts)
      .orderBy(desc(socialPosts.updatedAt))
      .limit(500),
    db
      .select({
        status: socialPosts.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(socialPosts)
      .groupBy(socialPosts.status),
  ]);

  const counts = Object.fromEntries(
    statusCounts.map((r) => [r.status, r.count])
  ) as Record<string, number>;

  // Group by status for tabs
  const grouped = {
    draft: posts.filter((p) => p.status === "draft"),
    approved: posts.filter((p) => p.status === "approved"),
    posted: posts.filter((p) => p.status === "posted"),
    queued: posts.filter((p) => p.status === "queued"),
    failed: posts.filter((p) => p.status === "failed"),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">Social Posts</h1>
        <Link
          href="/nalaadmin/social-test"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--burgundy-900)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--burgundy-900)]/90 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Card Editor
        </Link>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {(
          ["draft", "approved", "queued", "posted", "failed"] as PostStatus[]
        ).map((status) => (
          <div
            key={status}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="text-2xl font-bold">{counts[status] ?? 0}</div>
            <div className="text-sm text-[var(--muted-foreground)] capitalize">
              {status}
            </div>
          </div>
        ))}
      </div>

      {/* Post sections */}
      {(
        Object.entries(grouped) as [PostStatus, typeof posts][]
      ).map(([status, items]) => {
        if (items.length === 0) return null;
        return (
          <section key={status} className="mb-8">
            <h2 className="font-heading text-xl font-semibold mb-3 capitalize">
              {status}{" "}
              <span className="text-[var(--muted-foreground)] font-normal text-base">
                ({items.length})
              </span>
            </h2>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="text-left px-4 py-2 font-medium">Entity</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">
                      Headline
                    </th>
                    <th className="text-left px-4 py-2 font-medium">Tags</th>
                    <th className="text-left px-4 py-2 font-medium">
                      Updated
                    </th>
                    <th className="text-right px-4 py-2 font-medium">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {post.photoUrl ? (
                            <img
                              src={post.photoUrl}
                              alt=""
                              className="h-10 w-10 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-[var(--muted)]/40 flex items-center justify-center flex-shrink-0">
                              {post.entityType === "winery" ? (
                                <Wine className="h-4 w-4 text-[var(--muted-foreground)]" />
                              ) : (
                                <BedDouble className="h-4 w-4 text-[var(--muted-foreground)]" />
                              )}
                            </div>
                          )}
                          <span className="font-medium truncate max-w-[200px]">
                            {post.entitySlug.replace(/-/g, " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${
                            post.entityType === "winery"
                              ? "text-purple-600"
                              : "text-blue-600"
                          }`}
                        >
                          {post.entityType === "winery" ? (
                            <Wine className="h-3 w-3" />
                          ) : (
                            <BedDouble className="h-3 w-3" />
                          )}
                          {post.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] truncate max-w-[250px]">
                        {post.overlayHeadline ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {post.overlayTags
                            ?.split(",")
                            .filter(Boolean)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="inline-block rounded-full bg-[var(--muted)]/40 px-2 py-0.5 text-xs"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs whitespace-nowrap">
                        {post.updatedAt
                          ? new Date(post.updatedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/nalaadmin/social-test?slug=${post.entitySlug}&type=${post.entityType}`}
                          className="inline-flex items-center gap-1 text-xs text-[var(--foreground)] hover:text-[var(--burgundy-900)] transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {posts.length === 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">
          No social posts yet. Run the caption generator script first, or create
          a post in the Card Editor.
        </div>
      )}
    </div>
  );
}
