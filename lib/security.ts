import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { apiError } from './http';
import { consumeRateLimit } from './rate-limit';

const CSRF_COOKIE_NAME = process.env.AUTH_CSRF_COOKIE_NAME || 'poolpro_csrf';
const COOKIE_SECURE = process.env.NODE_ENV === 'production' || process.env.AUTH_COOKIE_SECURE === 'true';

export function getClientIp(req: NextRequest) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xrip = req.headers.get('x-real-ip');
  if (xrip) return xrip.trim();
  return 'unknown';
}

export function ensureCsrfToken() {
  const existing = cookies().get(CSRF_COOKIE_NAME)?.value;
  if (existing) return existing;
  const token = crypto.randomBytes(24).toString('hex');
  cookies().set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: COOKIE_SECURE,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

function validateSameOrigin(req: NextRequest) {
  if (process.env.NODE_ENV === 'test') return true;
  const origin = req.headers.get('origin');
  if (!origin) return false;

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || headers().get('host');
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  if (!host) return false;

  try {
    const originURL = new URL(origin);
    return originURL.host === host && originURL.protocol === `${proto}:`;
  } catch {
    return false;
  }
}

export function requireCsrf(req: NextRequest) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return null;
  if (!validateSameOrigin(req)) {
    return apiError(403, 'csrf validation failed', 'csrf_origin_invalid');
  }

  const headerToken = req.headers.get('x-csrf-token');
  const cookieToken = cookies().get(CSRF_COOKIE_NAME)?.value;
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return apiError(403, 'csrf token invalid', 'csrf_token_invalid');
  }

  return null;
}

export function checkRateLimit(req: NextRequest, scope: string, limit: number, windowMs: number) {
  const key = `${scope}:${getClientIp(req)}`;
  const result = consumeRateLimit(key, limit, windowMs);
  if (!result.allowed) {
    return apiError(429, 'too many requests', 'rate_limit_exceeded', {
      retryAfterMs: Math.max(0, result.resetAt - Date.now()),
    });
  }
  return null;
}
