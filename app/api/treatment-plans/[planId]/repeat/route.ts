import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { notFound, requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { requireCsrf } from '@/lib/security';
import { parseRouteParams } from '@/lib/validation';

const planParamsSchema = z
  .object({
    planId: z.string().cuid(),
  })
  .strict();

function toInputJsonValue(value: Prisma.JsonValue): Prisma.InputJsonValue {
  return value === null ? (Prisma.JsonNull as unknown as Prisma.InputJsonValue) : (value as Prisma.InputJsonValue);
}

export async function POST(req: NextRequest, { params }: { params: { planId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const csrfError = requireCsrf(req);
  if (csrfError) return csrfError;
  const parsedParams = parseRouteParams(params, planParamsSchema);
  if (!parsedParams.success) return parsedParams.response;
  const { planId } = parsedParams.data;

  const plan = await prisma.treatmentPlan.findFirst({ where: { id: planId, pool: { customer: { userId: session.userId } } } });
  if (!plan) return notFound('plan not found', 'plan_not_found');

  const repeated = await prisma.treatmentPlan.create({
    data: {
      poolId: plan.poolId,
      waterTestId: plan.waterTestId,
      source: plan.source,
      diagnosis: plan.diagnosis,
      confidence: plan.confidence,
      steps: toInputJsonValue(plan.steps),
      chemicalAdditions: toInputJsonValue(plan.chemicalAdditions),
      safetyNotes: toInputJsonValue(plan.safetyNotes),
      retestInHours: plan.retestInHours,
      whenToCallPro: toInputJsonValue(plan.whenToCallPro),
      conversationSummary: `Repeated plan from ${plan.createdAt.toISOString()}`,
    },
  });

  return NextResponse.json({ plan: repeated });
}
