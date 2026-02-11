export type CalculatorInput = {
  poolVolumeGallons?: number;
  readings: { fc?: number; ph?: number; ta?: number; ch?: number; cya?: number };
  targets: { fc?: number; ph?: number; ta?: number; ch?: number; cya?: number };
  productStrengths?: { liquidChlorinePercent?: number };
};

export type Dose = { chemical: string; amount: number; unit: string; notes: string };
export type CalculatorOutput = {
  confidence: 'High' | 'Medium' | 'Low';
  doses: Dose[];
  assumptions: string[];
  safetyNotes: string[];
  missingFields: string[];
  retestInHours: number;
};

const cap = (amount: number, max: number) => Math.min(Math.max(0, amount), max);

// Rule-of-thumb formulas based on common pool industry approximation tables.
export function calculateDosing(input: CalculatorInput): CalculatorOutput {
  const missing: string[] = [];
  const doses: Dose[] = [];
  const pool = input.poolVolumeGallons;
  if (!pool) missing.push('poolVolumeGallons');

  const lcPercent = input.productStrengths?.liquidChlorinePercent ?? 10;
  const { readings, targets } = input;

  if (pool && readings.fc !== undefined && targets.fc !== undefined && targets.fc > readings.fc) {
    const delta = targets.fc - readings.fc;
    const gallons = (delta * pool) / (10000 * lcPercent);
    const oz = cap(gallons * 128, 512);
    doses.push({ chemical: `liquid_chlorine_${lcPercent}pct`, amount: Number(oz.toFixed(1)), unit: 'oz', notes: 'Add half dose, circulate 30-60 min, retest before adding remainder.' });
  }

  if (pool && readings.ph !== undefined && targets.ph !== undefined && readings.ph > targets.ph) {
    const ta = readings.ta ?? 90;
    const phDelta = readings.ph - targets.ph;
    const baseOzPer10k = phDelta * 12 * (ta / 100);
    const oz = cap(baseOzPer10k * (pool / 10000), 64);
    doses.push({ chemical: 'muriatic_acid_31_45pct', amount: Number(oz.toFixed(1)), unit: 'oz', notes: 'Conservative first-step estimate; pre-dilute and pour slowly with pump running.' });
  }

  if (pool && readings.ta !== undefined && targets.ta !== undefined && targets.ta > readings.ta) {
    const delta = targets.ta - readings.ta;
    const lbs = cap((delta / 10) * (pool / 10000) * 1.4, 25);
    doses.push({ chemical: 'sodium_bicarbonate', amount: Number(lbs.toFixed(2)), unit: 'lb', notes: 'Split into 2 additions if >5 lb.' });
  }

  if (pool && readings.ch !== undefined && targets.ch !== undefined && targets.ch > readings.ch) {
    const delta = targets.ch - readings.ch;
    const lbs = cap((delta / 10) * (pool / 10000) * 1.25, 30);
    doses.push({ chemical: 'calcium_chloride', amount: Number(lbs.toFixed(2)), unit: 'lb', notes: 'Dissolve as directed; add in portions.' });
  }

  if (pool && readings.cya !== undefined && targets.cya !== undefined && targets.cya > readings.cya) {
    const delta = targets.cya - readings.cya;
    const oz = cap((delta / 10) * (pool / 10000) * 13, 128);
    doses.push({ chemical: 'cyanuric_acid', amount: Number(oz.toFixed(1)), unit: 'oz', notes: 'Add via sock method; avoid backwashing for 24-48h.' });
  }

  if (readings.cya === undefined) missing.push('cya');

  const confidence: CalculatorOutput['confidence'] = missing.length ? 'Low' : doses.length >= 3 ? 'High' : 'Medium';
  return {
    confidence,
    doses,
    assumptions: [
      'Conservative first-step dosing. Exact demand varies by water conditions and product brand.',
      'Never mix chemicals directly. Add one chemical at a time with circulation running.',
    ],
    safetyNotes: [
      'Wear PPE and follow manufacturer labels.',
      'Always retest before additional dosing.',
    ],
    missingFields: missing,
    retestInHours: 4,
  };
}
