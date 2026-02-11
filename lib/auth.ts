import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'poolpro_session';
const SECRET = process.env.AUTH_JWT_SECRET || 'dev-secret';
const SESSION_TTL_SECONDS = Number(process.env.AUTH_SESSION_TTL_SECONDS || 60 * 60 * 24 * 7);
const COOKIE_SECURE = process.env.NODE_ENV === 'production' || process.env.AUTH_COOKIE_SECURE === 'true';

if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_JWT_SECRET || process.env.AUTH_JWT_SECRET === 'dev-secret')) {
  throw new Error('AUTH_JWT_SECRET must be set to a strong value in production');
}

function b64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function hashPassword(password: string, salt?: string) {
  const s = salt ?? crypto.randomBytes(16).toString('hex');
  const digest = crypto.pbkdf2Sync(password, s, 100_000, 32, 'sha256').toString('hex');
  return `${s}:${digest}`;
}

export function verifyPassword(password: string, hash: string) {
  const [salt, digest] = hash.split(':');
  if (!salt || !digest) return false;
  const candidate = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

export function signSession(payload: { userId: string; email: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + SESSION_TTL_SECONDS, jti: crypto.randomUUID() }));
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifySession(token: string): { userId: string; email: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const expected = b64url(crypto.createHmac('sha256', SECRET).update(`${h}.${b}`).digest());
  if (expected !== s) return null;
  try {
    const payload = JSON.parse(Buffer.from(b.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, '', { httpOnly: true, expires: new Date(0), path: '/', sameSite: 'lax', secure: COOKIE_SECURE });
}

export function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return token ? verifySession(token) : null;
}
