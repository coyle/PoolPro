import { z } from 'zod';

export const llmPlanSchema = z.object({
  diagnosis: z.string(),
  confidence: z.enum(['High', 'Medium', 'Low']),
  steps: z.array(z.string()).min(1),
  chemical_additions: z.array(z.object({
    chemical: z.string(), amount: z.string(), unit: z.string(), instructions: z.string(),
  })),
  safety_notes: z.array(z.string()).min(1),
  retest_in_hours: z.number().int().min(1).max(48),
  when_to_call_pro: z.array(z.string()).min(1),
});

export type LlmPlan = z.infer<typeof llmPlanSchema>;
