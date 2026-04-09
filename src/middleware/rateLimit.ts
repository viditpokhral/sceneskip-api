// Simple in-memory sliding-window rate limiter.
// For multi-instance deployments, swap the Map for a Redis/Upstash store.
import { createMiddleware } from 'hono/factory';

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

// Clean up stale keys every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > 60_000) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export function rateLimit({ limit, windowMs }: RateLimitOptions) {
  return createMiddleware(async (c, next) => {
    // Use CF-Connecting-IP if behind a proxy, fall back to socket address
    const ip =
      c.req.header('cf-connecting-ip') ??
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
      'unknown';

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now - entry.windowStart > windowMs) {
      store.set(ip, { count: 1, windowStart: now });
      await next();
      return;
    }

    entry.count++;

    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: 'Too many requests', retryAfter },
        429,
      );
    }

    await next();
  });
}
