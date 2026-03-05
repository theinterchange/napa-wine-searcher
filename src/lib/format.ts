/**
 * Shared date formatting utilities
 */

const SHORT_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const MEDIUM_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

export function formatDate(
  date: string | Date,
  variant: "short" | "medium" | "relative" = "medium"
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (variant === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  }

  const fmt = variant === "short" ? SHORT_FORMAT : MEDIUM_FORMAT;
  return d.toLocaleDateString("en-US", fmt);
}
