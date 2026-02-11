import { NextRequest, NextResponse } from 'next/server';
import { requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { customerId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const customer = await prisma.customer.findFirst({ where: { id: params.customerId, userId: session.userId } });
  if (!customer) return NextResponse.json({ error: 'customer not found' }, { status: 404 });
  const pools = await prisma.pool.findMany({ where: { customerId: params.customerId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ pools });
}

export async function POST(req: NextRequest, { params }: { params: { customerId: string } }) {
  const session = requireSession();
  if (!session) return unauthorized();
  const customer = await prisma.customer.findFirst({ where: { id: params.customerId, userId: session.userId } });
  if (!customer) return NextResponse.json({ error: 'customer not found' }, { status: 404 });
  const body = await req.json();
  const pool = await prisma.pool.create({
    data: {
      customerId: params.customerId,
      name: body.name,
      volumeGallons: Number(body.volumeGallons),
      surfaceType: body.surfaceType || 'plaster',
      sanitizerType: body.sanitizerType || 'chlorine',
      isSalt: Boolean(body.isSalt),
      equipmentNotes: body.equipmentNotes,
    },
  });
  return NextResponse.json({ pool });
}
