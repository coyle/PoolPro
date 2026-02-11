import { NextRequest, NextResponse } from 'next/server';
import { requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { poolId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const pool = await prisma.pool.findFirst({ where: { id: params.poolId, customer: { userId: session.userId } } });
  if (!pool) return NextResponse.json({ error: 'pool not found' }, { status: 404 });

  const [tests, plans] = await Promise.all([
    prisma.waterTest.findMany({ where: { poolId: params.poolId }, orderBy: { testedAt: 'desc' }, take: 20 }),
    prisma.treatmentPlan.findMany({ where: { poolId: params.poolId }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);

  const timeline = [
    ...tests.map((t) => ({ type: 'water_test', at: t.testedAt, data: t })),
    ...plans.map((p) => ({ type: 'treatment_plan', at: p.createdAt, data: p })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const compare = tests.length >= 2 ? { latest: tests[0], previous: tests[1] } : null;
  return NextResponse.json({ timeline, compare });
}
