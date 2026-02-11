import { NextResponse } from 'next/server';
import { getSession } from './auth';

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function requireSession() {
  return getSession();
}
