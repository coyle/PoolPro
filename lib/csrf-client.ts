function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const target = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return decodeURIComponent(trimmed.slice(target.length));
  }
  return null;
}

async function ensureCsrfToken() {
  const existing = getCookie('poolpro_csrf');
  if (existing) return existing;
  const res = await fetch('/api/auth/csrf', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to initialize CSRF token');
  const body = await res.json();
  return body.csrfToken as string;
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return fetch(input, init);
  }

  const token = await ensureCsrfToken();
  const headers = new Headers(init.headers || {});
  headers.set('x-csrf-token', token);
  return fetch(input, { ...init, headers, credentials: 'include' });
}
