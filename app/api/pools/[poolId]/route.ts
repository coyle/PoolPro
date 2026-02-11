import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { notFound, requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { parseRouteParams } from '@/lib/validation';

const poolParamsSchema = z
  .object({
    poolId: z.string().cuid(),
  })
  .strict();

export async function GET(_: NextRequest, { params }: { params: { poolId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();

  const parsedParams = parseRouteParams(params, poolParamsSchema);
  if (!parsedParams.success) return parsedParams.response;
  const { poolId } = parsedParams.data;

  const pool = await prisma.pool.findFirst({
    where: { id: poolId, customer: { userId: session.userId } },
    select: {
      id: true,
      name: true,
      volumeGallons: true,
      surfaceType: true,
      sanitizerType: true,
      isSalt: true,
    },
  });
  if (!pool) return notFound('pool not found', 'pool_not_found');

  return NextResponse.json({ pool });
}
