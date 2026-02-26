/**
 * Convert raw HTML to clean markdown-like text suitable for LLM extraction.
 * Strips navigation, footer, cookie banners, scripts, styles.
 */
export function htmlToCleanText(html: string): string {
  let text = html;

  // Remove script and style tags with content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // Remove common non-content elements
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  text = text.replace(/<header[\s\S]*?<\/header>/gi, "");

  // Remove cookie consent / banners (common class patterns)
  text = text.replace(
    /<div[^>]*class="[^"]*(?:cookie|consent|banner|popup|modal|overlay)[^"]*"[\s\S]*?<\/div>/gi,
    ""
  );

  // Convert common HTML elements to markdown
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");
  text = text.replace(/<h[1-6][^>]*>/gi, "\n## ");
  text = text.replace(/<li[^>]*>/gi, "- ");

  // Extract href from links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&#\d+;/g, "");
  text = text.replace(/&\w+;/g, "");

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n[ \t]+/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  // Truncate if very long (LLM context limit)
  const MAX_CHARS = 15000;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) + "\n\n[Content truncated]";
  }

  return text;
}

/**
 * Extract image URLs from HTML content.
 */
export function extractImageUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const imgRegex = /<img[^>]*src="([^"]+)"[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    let src = match[1];
    // Skip tiny images (likely icons/tracking pixels)
    const widthMatch = match[0].match(/width="(\d+)"/);
    if (widthMatch && parseInt(widthMatch[1]) < 100) continue;

    // Resolve relative URLs
    if (src.startsWith("/")) {
      try {
        const base = new URL(baseUrl);
        src = `${base.origin}${src}`;
      } catch {
        continue;
      }
    } else if (!src.startsWith("http")) {
      continue;
    }

    // Skip data URIs and common non-photo patterns
    if (src.startsWith("data:")) continue;
    if (src.includes("pixel") || src.includes("tracking")) continue;
    if (src.includes(".svg")) continue;

    urls.push(src);
  }

  return [...new Set(urls)]; // dedupe
}
