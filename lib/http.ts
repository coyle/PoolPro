import { NextResponse } from 'next/server';
import { getSession } from './auth';

export function apiError(status: number, error: string, code: string, details?: unknown) {
  return NextResponse.json(details ? { error, code, details } : { error, code }, { status });
}

export function unauthorized() {
  return apiError(401, 'Unauthorized', 'unauthorized');
}

export function notFound(error: string, code: string) {
  return apiError(404, error, code);
}

export function requireSession() {
  return getSession();
}
