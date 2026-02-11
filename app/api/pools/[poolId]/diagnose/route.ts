import { Confidence, PlanSource } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, notFound, requireSession, unauthorized } from '@/lib/http';
import { llmPlanSchema } from '@/lib/llm/schema';
import { enforceDiagnoseSafety } from '@/lib/llm/safety';
import { prisma } from '@/lib/prisma';
import { requireCsrf } from '@/lib/security';
import { parseJsonBody, parseRouteParams } from '@/lib/validation';

const poolParamsSchema = z
  .object({
    poolId: z.string().cuid(),
  })
  .strict();

const diagnoseBodySchema = z
  .object({
    symptoms: z.string().trim().max(2000).optional(),
    context: z
      .object({
        poolVolumeGallons: z.number().positive().max(1_000_000).optional(),
        surfaceType: z.string().trim().max(50).optional(),
        sanitizerType: z.string().trim().max(50).optional(),
        isSalt: z.boolean().optional(),
        latestTest: z
          .object({
            testedAt: z.string().datetime().optional(),
            fc: z.number().min(0).max(100).nullable().optional(),
            cc: z.number().min(0).max(30).nullable().optional(),
            ph: z.number().min(0).max(14).nullable().optional(),
            ta: z.number().min(0).max(1000).nullable().optional(),
            ch: z.number().min(0).max(5000).nullable().optional(),
            cya: z.number().min(0).max(500).nullable().optional(),
            salt: z.number().min(0).max(20000).nullable().optional(),
            tempF: z.number().min(-20).max(180).nullable().optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

function getGoApiBase() {
  return process.env.GO_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
}

function toPrismaConfidence(confidence: 'High' | 'Medium' | 'Low'): Confidence {
  if (confidence === 'High') return Confidence.HIGH;
  if (confidence === 'Medium') return Confidence.MEDIUM;
  return Confidence.LOW;
}

export async function POST(req: NextRequest, { params }: { params: { poolId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const csrfError = requireCsrf(req);
  if (csrfError) return csrfError;

  const parsedParams = parseRouteParams(params, poolParamsSchema);
  if (!parsedParams.success) return parsedParams.response;
  const { poolId } = parsedParams.data;

  const pool = await prisma.pool.findFirst({
    where: { id: poolId, customer: { userId: session.userId } },
    select: { id: true, volumeGallons: true, surfaceType: true, sanitizerType: true, isSalt: true },
  });
  if (!pool) return notFound('pool not found', 'pool_not_found');

  const parsedBody = await parseJsonBody(req, diagnoseBodySchema);
  if (!parsedBody.success) return parsedBody.response;
  const body = parsedBody.data;

  const payload = {
    poolId,
    symptoms: body.symptoms || '',
    context: {
      poolVolumeGallons: body.context?.poolVolumeGallons ?? pool.volumeGallons,
      surfaceType: body.context?.surfaceType ?? pool.surfaceType,
      sanitizerType: body.context?.sanitizerType ?? pool.sanitizerType,
      isSalt: body.context?.isSalt ?? pool.isSalt,
      latestTest: body.context?.latestTest,
    },
  };

  const goRes = await fetch(`${getGoApiBase()}/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!goRes.ok) {
    return apiError(502, 'diagnose upstream request failed', 'diagnose_upstream_failed');
  }

  const upstream = await goRes.json();
  const validatedPlan = llmPlanSchema.safeParse(upstream.plan);
  if (!validatedPlan.success) {
    return apiError(502, 'diagnose upstream returned invalid plan', 'diagnose_upstream_invalid');
  }

  const { plan, warnings } = enforceDiagnoseSafety(validatedPlan.data, {
    poolVolumeGallons: payload.context.poolVolumeGallons,
    latestTest: payload.context.latestTest,
  });

  const latestTest = await prisma.waterTest.findFirst({
    where: { poolId },
    orderBy: { testedAt: 'desc' },
    select: { id: true },
  });

  const saved = await prisma.treatmentPlan.create({
    data: {
      poolId,
      waterTestId: latestTest?.id,
      source: PlanSource.llm,
      diagnosis: plan.diagnosis,
      confidence: toPrismaConfidence(plan.confidence),
      steps: plan.steps,
      chemicalAdditions: plan.chemical_additions,
      safetyNotes: plan.safety_notes,
      retestInHours: plan.retest_in_hours,
      whenToCallPro: plan.when_to_call_pro,
      conversationSummary: `Diagnose request. source=${upstream.source || 'fallback'} symptoms=${(body.symptoms || '').slice(0, 200)}`,
    },
    select: { id: true },
  });

  return NextResponse.json({
    plan,
    source: upstream.source || 'fallback',
    warning: upstream.warning,
    safetyAdjustments: warnings,
    savedPlanId: saved.id,
  });
}
