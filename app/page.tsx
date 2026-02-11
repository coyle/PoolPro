import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <h1 className="text-xl font-semibold">Pool Pro LLM</h1>
        <p className="text-sm text-slate-600">Mobile-first assistant for pool diagnosis, dosing, and history.</p>
        <Link className="btn-primary inline-block" href="/dashboard">Open Dashboard</Link>
      </div>
    </div>
  );
}
