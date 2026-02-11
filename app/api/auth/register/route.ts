import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, setSessionCookie, signSession } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, ensureCsrfToken, requireCsrf } from '@/lib/security';
import { parseJsonBody } from '@/lib/validation';

const registerSchema = z
  .object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(1, 'password required'),
    name: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const csrfError = requireCsrf(req);
  if (csrfError) return csrfError;
  const rateError = checkRateLimit(req, 'auth_register', 12, 15 * 60 * 1000);
  if (rateError) return rateError;

  const parsed = await parseJsonBody(req, registerSchema);
  if (!parsed.success) return parsed.response;
  const { email, password, name } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return apiError(409, 'email already exists', 'email_conflict');

  const user = await prisma.user.create({
    data: { email, name, passwordHash: hashPassword(password) },
    select: { id: true, email: true, name: true },
  });
  setSessionCookie(signSession({ userId: user.id, email: user.email }));
  const csrfToken = ensureCsrfToken();
  return NextResponse.json({ user, csrfToken });
}
