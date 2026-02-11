import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { requireCsrf } from '@/lib/security';
import { parseJsonBody } from '@/lib/validation';

const customerCreateSchema = z
  .object({
    name: z.string().trim().min(1, 'name required').max(120),
    address: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export async function GET() {
  const session = requireSession();
  if (!session) return unauthorized();
  const customers = await prisma.customer.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const session = requireSession();
  if (!session) return unauthorized();
  const csrfError = requireCsrf(req);
  if (csrfError) return csrfError;
  const parsed = await parseJsonBody(req, customerCreateSchema);
  if (!parsed.success) return parsed.response;
  const { name, address, notes } = parsed.data;

  const customer = await prisma.customer.create({ data: { userId: session.userId, name, address, notes } });
  return NextResponse.json({ customer });
}
