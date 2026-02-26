import { config } from "../config";

/**
 * Per-domain rate limiter. Ensures only one concurrent request per domain
 * and enforces a random delay between requests to the same domain.
 */
export class RateLimiter {
  private domainTimestamps = new Map<string, number>();
  private domainLocks = new Map<string, Promise<void>>();

  private getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  private randomDelay(): number {
    const { minDelayBetweenRequestsMs, maxDelayBetweenRequestsMs } =
      config.rateLimiting;
    return (
      minDelayBetweenRequestsMs +
      Math.random() * (maxDelayBetweenRequestsMs - minDelayBetweenRequestsMs)
    );
  }

  async acquire(url: string): Promise<void> {
    const domain = this.getDomain(url);

    // Wait for any existing lock on this domain
    while (this.domainLocks.has(domain)) {
      await this.domainLocks.get(domain);
    }

    // Check if we need to wait based on last request time
    const lastRequest = this.domainTimestamps.get(domain);
    if (lastRequest) {
      const elapsed = Date.now() - lastRequest;
      const delay = this.randomDelay();
      if (elapsed < delay) {
        await new Promise((r) => setTimeout(r, delay - elapsed));
      }
    }

    // Set lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.domainLocks.set(domain, lockPromise);

    // Store release function for later
    (lockPromise as unknown as { release: () => void }).release = releaseLock!;
  }

  release(url: string): void {
    const domain = this.getDomain(url);
    this.domainTimestamps.set(domain, Date.now());
    const lock = this.domainLocks.get(domain);
    if (lock) {
      this.domainLocks.delete(domain);
      (lock as unknown as { release: () => void }).release();
    }
  }
}

export const rateLimiter = new RateLimiter();
