import { calculateDosing } from '../chemistry/dosing';
import type { LlmPlan } from './schema';

const UNSAFE_PATTERNS = [
  /mix .*chemicals/i,
  /combine .*chlorine .*acid/i,
  /no retest/i,
  /skip retest/i,
];

type DiagnoseContext = {
  poolVolumeGallons?: number;
  latestTest?: {
    fc?: number | null;
    cc?: number | null;
    ph?: number | null;
    ta?: number | null;
    ch?: number | null;
    cya?: number | null;
  };
};

function parseNumericAmount(value: string) {
  const n = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function enforceDiagnoseSafety(plan: LlmPlan, context?: DiagnoseContext) {
  const warnings: string[] = [];

  const checkUnsafe = (text: string) => UNSAFE_PATTERNS.some((pattern) => pattern.test(text));
  const combinedText = [
    plan.diagnosis,
    ...plan.steps,
    ...plan.safety_notes,
    ...plan.chemical_additions.map((c) => c.instructions),
  ].join('\n');
  if (checkUnsafe(combinedText)) {
    throw new Error('Unsafe chemical instruction detected');
  }

  if (!plan.safety_notes.some((note) => /retest/i.test(note))) {
    plan.safety_notes.push('Always retest before additional chemical additions.');
    warnings.push('Added missing retest guidance.');
  }

  if (!plan.when_to_call_pro.length) {
    plan.when_to_call_pro.push('If water remains unsafe after conservative treatment, call a professional.');
    warnings.push('Added missing when-to-call-pro guidance.');
  }

  const poolVolume = context?.poolVolumeGallons;
  const fc = context?.latestTest?.fc ?? undefined;
  if (poolVolume && fc !== undefined) {
    const targetFc = Math.min(8, Math.max(3, fc + 2));
    const calc = calculateDosing({
      poolVolumeGallons: poolVolume,
      readings: { fc },
      targets: { fc: targetFc },
      productStrengths: { liquidChlorinePercent: 10 },
    });
    const recommendedChlorine = calc.doses.find((dose) => dose.chemical.includes('liquid_chlorine'));
    if (recommendedChlorine) {
      const cap = Number((recommendedChlorine.amount * 1.5).toFixed(1));
      for (const addition of plan.chemical_additions) {
        const isChlorine = /chlorine|hypochlorite/i.test(addition.chemical);
        const amount = parseNumericAmount(addition.amount);
        if (isChlorine && addition.unit.toLowerCase() === 'oz' && amount !== null && amount > cap) {
          addition.amount = String(cap);
          addition.instructions = `${addition.instructions} Capped to conservative threshold using deterministic dosing check.`;
          warnings.push(`Capped chlorine addition to ${cap} oz.`);
        }
      }
    }
  }

  if (plan.retest_in_hours < 2) {
    plan.retest_in_hours = 2;
    warnings.push('Raised retest window to 2 hours minimum for conservative safety.');
  }

  return { plan, warnings };
}
