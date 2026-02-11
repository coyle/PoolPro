import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, setSessionCookie, signSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'email already exists' }, { status: 409 });

  const user = await prisma.user.create({
    data: { email, name, passwordHash: hashPassword(password) },
    select: { id: true, email: true, name: true },
  });
  setSessionCookie(signSession({ userId: user.id, email: user.email }));
  return NextResponse.json({ user });
}
