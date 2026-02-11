import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie, signSession, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
  }
  setSessionCookie(signSession({ userId: user.id, email: user.email }));
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
