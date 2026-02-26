import pRetry from "p-retry";
import { config } from "../config";

/**
 * Retry a function with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  return pRetry(fn, {
    retries: config.rateLimiting.maxRetries,
    minTimeout: config.rateLimiting.initialRetryDelayMs,
    onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
      console.warn(
        `  [retry] ${label} — attempt ${attemptNumber} failed (${retriesLeft} left): ${error.message}`
      );
    },
  });
}
