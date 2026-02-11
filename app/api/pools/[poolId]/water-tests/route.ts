import { NextRequest, NextResponse } from 'next/server';
import { requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';

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
  const b = await req.json();
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
