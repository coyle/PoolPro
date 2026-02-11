import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { requireCsrf } from '@/lib/security';

export async function POST(req: NextRequest) {
  const csrfError = requireCsrf(req);
  if (csrfError) return csrfError;
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
