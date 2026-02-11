'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@poolpro.local');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async () => {
    setError('');
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) return setError((await res.json()).error || 'Login failed');
    router.push('/dashboard');
  };

  return (
    <div className="card space-y-3">
      <h1 className="text-lg font-semibold">Sign in</h1>
      <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary" onClick={submit}>Login</button>
    </div>
  );
}
