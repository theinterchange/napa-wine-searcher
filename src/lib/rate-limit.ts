interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit({ windowMs, max }: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Prune stale entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return {
    check(ip: string): { success: boolean; remaining: number } {
      const now = Date.now();
      const entry = store.get(ip);

      if (!entry || now > entry.resetAt) {
        store.set(ip, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: max - 1 };
      }

      entry.count++;
      if (entry.count > max) {
        return { success: false, remaining: 0 };
      }

      return { success: true, remaining: max - entry.count };
    },
  };
}
