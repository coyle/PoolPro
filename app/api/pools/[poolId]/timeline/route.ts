import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { notFound, requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { parseQuery, parseRouteParams } from '@/lib/validation';

const poolParamsSchema = z
  .object({
    poolId: z.string().cuid(),
  })
  .strict();

const timelineQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export async function GET(req: NextRequest, { params }: { params: { poolId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const parsedParams = parseRouteParams(params, poolParamsSchema);
  if (!parsedParams.success) return parsedParams.response;
  const { poolId } = parsedParams.data;

  const parsedQuery = parseQuery(req, timelineQuerySchema);
  if (!parsedQuery.success) return parsedQuery.response;
  const limit = parsedQuery.data.limit ?? 20;

  const pool = await prisma.pool.findFirst({ where: { id: poolId, customer: { userId: session.userId } } });
  if (!pool) return notFound('pool not found', 'pool_not_found');

  const [tests, plans] = await Promise.all([
    prisma.waterTest.findMany({ where: { poolId }, orderBy: { testedAt: 'desc' }, take: limit }),
    prisma.treatmentPlan.findMany({ where: { poolId }, orderBy: { createdAt: 'desc' }, take: limit }),
  ]);

  const timeline = [
    ...tests.map((t) => ({ type: 'water_test', at: t.testedAt, data: t })),
    ...plans.map((p) => ({ type: 'treatment_plan', at: p.createdAt, data: p })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const compare = tests.length >= 2 ? { latest: tests[0], previous: tests[1] } : null;
  return NextResponse.json({ timeline, compare });
}
