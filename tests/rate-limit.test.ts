import { describe, expect, it } from 'vitest';
import { consumeRateLimit } from '../lib/rate-limit';

describe('rate limiter', () => {
  it('blocks after limit until window resets', () => {
    const key = `test-key-${Date.now()}`;
    const limit = 3;
    const windowMs = 2000;

    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(true);
    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(true);
    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(true);
    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(false);
  });
});
