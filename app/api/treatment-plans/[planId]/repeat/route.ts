import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';

function toInputJsonValue(value: Prisma.JsonValue): Prisma.InputJsonValue {
  return value === null ? (Prisma.JsonNull as unknown as Prisma.InputJsonValue) : (value as Prisma.InputJsonValue);
}

export async function POST(_: Request, { params }: { params: { planId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const plan = await prisma.treatmentPlan.findFirst({ where: { id: params.planId, pool: { customer: { userId: session.userId } } } });
  if (!plan) return NextResponse.json({ error: 'plan not found' }, { status: 404 });

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
