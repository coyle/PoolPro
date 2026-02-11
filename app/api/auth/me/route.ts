import { NextResponse } from 'next/server';
import { requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = requireSession();
  if (!session) return unauthorized();
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, name: true } });
  return NextResponse.json({ user });
}
