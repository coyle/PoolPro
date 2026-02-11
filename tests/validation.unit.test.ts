import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseRouteParams } from '../lib/validation';

describe('validation helpers', () => {
  it('returns structured errors for route params', () => {
    const result = parseRouteParams({ poolId: 'not-a-cuid' }, z.object({ poolId: z.string().cuid() }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});
