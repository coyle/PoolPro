import { describe, expect, it } from 'vitest';
import { calculateDosing } from '../lib/chemistry/dosing';

describe('calculateDosing', () => {
  it('calculates chlorine dose', () => {
    const result = calculateDosing({ poolVolumeGallons: 10000, readings: { fc: 1 }, targets: { fc: 3 } });
    const chlorine = result.doses.find((d) => d.chemical.includes('liquid_chlorine'));
    expect(chlorine?.amount).toBeGreaterThan(20);
    expect(result.safetyNotes.length).toBeGreaterThan(0);
  });

  it('returns low confidence when missing volume', () => {
    const result = calculateDosing({ readings: { fc: 1 }, targets: { fc: 3 } });
    expect(result.confidence).toBe('Low');
    expect(result.missingFields).toContain('poolVolumeGallons');
  });
});
