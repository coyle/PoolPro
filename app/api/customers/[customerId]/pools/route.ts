import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { notFound, requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, parseRouteParams } from '@/lib/validation';

const poolCreateSchema = z
  .object({
    name: z.string().trim().min(1, 'name required').max(120),
    volumeGallons: z.coerce.number().int().positive().max(1_000_000),
    surfaceType: z.enum(['plaster', 'vinyl', 'fiberglass', 'other']).optional(),
    sanitizerType: z.enum(['chlorine', 'salt', 'bromine', 'other']).optional(),
    isSalt: z.boolean().optional(),
    equipmentNotes: z.string().trim().max(1000).optional(),
  })
  .strict();

const customerParamsSchema = z
  .object({
    customerId: z.string().cuid(),
  })
  .strict();

export async function GET(_: NextRequest, { params }: { params: { customerId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const parsedParams = parseRouteParams(params, customerParamsSchema);
  if (!parsedParams.success) return parsedParams.response;
  const { customerId } = parsedParams.data;

  const customer = await prisma.customer.findFirst({ where: { id: customerId, userId: session.userId } });
  if (!customer) return notFound('customer not found', 'customer_not_found');
  const pools = await prisma.pool.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ pools });
}

export async function POST(req: NextRequest, { params }: { params: { customerId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const parsedParams = parseRouteParams(params, customerParamsSchema);
  if (!parsedParams.success) return parsedParams.response;
  const { customerId } = parsedParams.data;

  const customer = await prisma.customer.findFirst({ where: { id: customerId, userId: session.userId } });
  if (!customer) return notFound('customer not found', 'customer_not_found');
  const parsed = await parseJsonBody(req, poolCreateSchema);
  if (!parsed.success) return parsed.response;
  const body = parsed.data;

  const pool = await prisma.pool.create({
    data: {
      customerId,
      name: body.name,
      volumeGallons: body.volumeGallons,
      surfaceType: body.surfaceType || 'plaster',
      sanitizerType: body.sanitizerType || 'chlorine',
      isSalt: Boolean(body.isSalt),
      equipmentNotes: body.equipmentNotes,
    },
  });
  return NextResponse.json({ pool });
}
