/**
 * Playwright browser pool with concurrency control.
 * Reuses a single browser instance with multiple pages.
 */

import { chromium, type Browser } from "playwright";
import pLimit from "p-limit";
import { config } from "../config";

let browserInstance: Browser | null = null;
const limit = pLimit(config.rateLimiting.maxConcurrentBrowsers);

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Run a browser task with concurrency limiting.
 */
export async function withBrowser<T>(
  fn: (browser: Browser) => Promise<T>
): Promise<T> {
  return limit(async () => {
    const browser = await getBrowser();
    return fn(browser);
  });
}
