import { describe, expect, it } from 'vitest';
import { enforceDiagnoseSafety } from '../lib/llm/safety';

describe('llm safety enforcement', () => {
  it('adds retest guidance when missing', () => {
    const { plan, warnings } = enforceDiagnoseSafety({
      diagnosis: 'Likely low sanitizer.',
      confidence: 'Medium',
      steps: ['Clean filter'],
      chemical_additions: [{ chemical: 'liquid_chlorine_10pct', amount: '64', unit: 'oz', instructions: 'Add half now.' }],
      safety_notes: ['Wear PPE'],
      retest_in_hours: 4,
      when_to_call_pro: ['If no improvement in 24h'],
    });
    expect(plan.safety_notes.some((s) => /retest/i.test(s))).toBe(true);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('caps oversized chlorine amount using deterministic check', () => {
    const { plan } = enforceDiagnoseSafety(
      {
        diagnosis: 'Likely low chlorine.',
        confidence: 'High',
        steps: ['Shock now'],
        chemical_additions: [{ chemical: 'liquid_chlorine_10pct', amount: '500', unit: 'oz', instructions: 'Add now' }],
        safety_notes: ['Retest in 4 hours'],
        retest_in_hours: 4,
        when_to_call_pro: ['If still cloudy'],
      },
      { poolVolumeGallons: 15000, latestTest: { fc: 1 } },
    );
    expect(Number(plan.chemical_additions[0].amount)).toBeLessThan(500);
  });
});
