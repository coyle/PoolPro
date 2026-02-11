import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { notFound, requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { requireCsrf } from '@/lib/security';
import { parseJsonBody, parseQuery, parseRouteParams } from '@/lib/validation';

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().finite().min(min).max(max).optional(),
  );

const waterTestCreateSchema = z
  .object({
    testedAt: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? undefined : value),
      z.coerce.date().optional(),
    ),
    fc: optionalNumber(0, 100),
    cc: optionalNumber(0, 30),
    ph: optionalNumber(0, 14),
    ta: optionalNumber(0, 1000),
    ch: optionalNumber(0, 5000),
    cya: optionalNumber(0, 500),
    salt: optionalNumber(0, 20000),
    tempF: optionalNumber(-20, 180),
    symptoms: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? undefined : value),
      z.string().trim().max(2000).optional(),
    ),
  })
  .strict();

const poolParamsSchema = z
  .object({
    poolId: z.string().cuid(),
  })
  .strict();

const waterTestsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

async function canAccessPool(userId: string, poolId: string) {
  return prisma.pool.findFirst({ where: { id: poolId, customer: { userId } } });
}

export async function GET(req: NextRequest, { params }: { params: { poolId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const parsedParams = parseRouteParams(params, poolParamsSchema);
  if (!parsedParams.success) return parsedParams.response;
  const { poolId } = parsedParams.data;

  const parsedQuery = parseQuery(req, waterTestsQuerySchema);
  if (!parsedQuery.success) return parsedQuery.response;
  const limit = parsedQuery.data.limit ?? 50;

  const pool = await canAccessPool(session.userId, poolId);
  if (!pool) return notFound('pool not found', 'pool_not_found');
  const tests = await prisma.waterTest.findMany({ where: { poolId }, orderBy: { testedAt: 'desc' }, take: limit });
  return NextResponse.json({ tests });
}

export async function POST(req: NextRequest, { params }: { params: { poolId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const csrfError = requireCsrf(req);
  if (csrfError) return csrfError;
  const parsedParams = parseRouteParams(params, poolParamsSchema);
  if (!parsedParams.success) return parsedParams.response;
  const { poolId } = parsedParams.data;

  const pool = await canAccessPool(session.userId, poolId);
  if (!pool) return notFound('pool not found', 'pool_not_found');
  const parsed = await parseJsonBody(req, waterTestCreateSchema);
  if (!parsed.success) return parsed.response;
  const b = parsed.data;

  const test = await prisma.waterTest.create({
    data: {
      poolId,
      testedAt: b.testedAt ? new Date(b.testedAt) : new Date(),
      fc: b.fc,
      cc: b.cc,
      ph: b.ph,
      ta: b.ta,
      ch: b.ch,
      cya: b.cya,
      salt: b.salt,
      tempF: b.tempF,
      symptoms: b.symptoms,
    },
  });
  return NextResponse.json({ test });
}
