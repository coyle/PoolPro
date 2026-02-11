import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <h1 className="text-xl font-semibold">Pool Pro LLM</h1>
        <p className="text-sm text-slate-600">Diagnose pool issues safely, calculate dosing, and store pool history.</p>
        <div className="flex gap-2">
          <Link className="btn-primary inline-block" href="/dashboard">Open Dashboard</Link>
          <Link className="btn inline-block border" href="/login">Login</Link>
          <Link className="btn inline-block border" href="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
