import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, setSessionCookie, signSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJsonBody } from '@/lib/validation';

const registerSchema = z
  .object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(1, 'password required'),
    name: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, registerSchema);
  if (!parsed.success) return parsed.response;
  const { email, password, name } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'email already exists' }, { status: 409 });

  const user = await prisma.user.create({
    data: { email, name, passwordHash: hashPassword(password) },
    select: { id: true, email: true, name: true },
  });
  setSessionCookie(signSession({ userId: user.id, email: user.email }));
  return NextResponse.json({ user });
}
