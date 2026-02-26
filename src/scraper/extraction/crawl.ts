/**
 * Crawl a page using Playwright and extract clean text + images.
 */

import type { Browser } from "playwright";
import { htmlToCleanText, extractImageUrls } from "../utils/markdown";
import { rateLimiter } from "../utils/rate-limiter";
import { withRetry } from "../utils/retry";

export interface CrawlResult {
  url: string;
  text: string;
  imageUrls: string[];
  success: boolean;
  error?: string;
}

export async function crawlPage(
  browser: Browser,
  url: string
): Promise<CrawlResult> {
  try {
    await rateLimiter.acquire(url);

    const result = await withRetry(async () => {
      const page = await browser.newPage();
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        // Wait for dynamic content to render after DOM is ready
        await page.waitForTimeout(3000);

        // Try clicking "Load More" or "Show All" buttons if present
        try {
          const loadMoreButton = await page.$(
            'button:has-text("Load More"), button:has-text("Show All"), button:has-text("View All"), a:has-text("Load More"), a:has-text("Show All")'
          );
          if (loadMoreButton) {
            await loadMoreButton.click();
            await page.waitForTimeout(2000);
          }
        } catch {
          // No load more button, that's fine
        }

        const html = await page.content();
        const text = htmlToCleanText(html);
        const imageUrls = extractImageUrls(html, url);

        return { url, text, imageUrls, success: true };
      } finally {
        await page.close();
      }
    }, `crawl ${url}`);

    rateLimiter.release(url);
    return result;
  } catch (err) {
    rateLimiter.release(url);
    return {
      url,
      text: "",
      imageUrls: [],
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
