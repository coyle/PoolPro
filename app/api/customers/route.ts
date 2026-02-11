import { NextRequest, NextResponse } from 'next/server';
import { requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = requireSession();
  if (!session) return unauthorized();
  const customers = await prisma.customer.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const session = requireSession();
  if (!session) return unauthorized();
  const { name, address, notes } = await req.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const customer = await prisma.customer.create({ data: { userId: session.userId, name, address, notes } });
  return NextResponse.json({ customer });
}
