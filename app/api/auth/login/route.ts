import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/http';
import { setSessionCookie, signSession, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJsonBody } from '@/lib/validation';

const loginSchema = z
  .object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(1, 'password required'),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, loginSchema);
  if (!parsed.success) return parsed.response;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return apiError(401, 'invalid credentials', 'invalid_credentials');
  }
  setSessionCookie(signSession({ userId: user.id, email: user.email }));
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
