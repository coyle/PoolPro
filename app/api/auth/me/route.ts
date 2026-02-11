import { NextResponse } from 'next/server';
import { setSessionCookie, signSession } from '@/lib/auth';
import { requireSession, unauthorized } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { ensureCsrfToken } from '@/lib/security';

export async function GET() {
  const session = requireSession();
  if (!session) return unauthorized();
  setSessionCookie(signSession({ userId: session.userId, email: session.email }));
  const csrfToken = ensureCsrfToken();
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, name: true } });
  return NextResponse.json({ user, csrfToken });
}
