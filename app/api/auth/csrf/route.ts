import { NextResponse } from 'next/server';
import { ensureCsrfToken } from '@/lib/security';

export async function GET() {
  const csrfToken = ensureCsrfToken();
  return NextResponse.json({ csrfToken });
}
