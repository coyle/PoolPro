type Bucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as unknown as {
  __poolproRateLimitBuckets?: Map<string, Bucket>;
};

const buckets = globalForRateLimit.__poolproRateLimitBuckets ?? new Map<string, Bucket>();
if (!globalForRateLimit.__poolproRateLimitBuckets) globalForRateLimit.__poolproRateLimitBuckets = buckets;

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}
