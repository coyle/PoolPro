import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { parseJsonBody } from '@/lib/validation';

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

async function canAccessPool(userId: string, poolId: string) {
  return prisma.pool.findFirst({ where: { id: poolId, customer: { userId } } });
}

export async function GET(_: NextRequest, { params }: { params: { poolId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const pool = await canAccessPool(session.userId, params.poolId);
  if (!pool) return NextResponse.json({ error: 'pool not found' }, { status: 404 });
  const tests = await prisma.waterTest.findMany({ where: { poolId: params.poolId }, orderBy: { testedAt: 'desc' }, take: 50 });
  return NextResponse.json({ tests });
}

export async function POST(req: NextRequest, { params }: { params: { poolId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const pool = await canAccessPool(session.userId, params.poolId);
  if (!pool) return NextResponse.json({ error: 'pool not found' }, { status: 404 });
  const parsed = await parseJsonBody(req, waterTestCreateSchema);
  if (!parsed.success) return parsed.response;
  const b = parsed.data;

  const test = await prisma.waterTest.create({
    data: {
      poolId: params.poolId,
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
