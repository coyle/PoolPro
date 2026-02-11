import { describe, expect, it } from 'vitest';
import { calculateDosing } from '../lib/chemistry/dosing';

describe('api smoke shape', () => {
  it('returns expected keys for calculator engine', () => {
    const out = calculateDosing({ poolVolumeGallons: 15000, readings: { fc: 1, cya: 20 }, targets: { fc: 4, cya: 40 } });
    expect(out).toHaveProperty('confidence');
    expect(out).toHaveProperty('doses');
    expect(out).toHaveProperty('retestInHours');
  });
});
