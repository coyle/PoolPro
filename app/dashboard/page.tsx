'use client';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-sm font-semibold text-amber-700">Safety first: Add chemicals in small steps and always retest.</p>
      </div>
      <div className="grid gap-3">
        <Link href="/dashboard/customers/demo" className="card block">Start Wizard: Customer → Pool → Test → Plan</Link>
        <Link href="/dashboard/pools/demo/calculator" className="card block">Open Calculator</Link>
        <Link href="/dashboard/pools/demo/diagnose" className="card block">Open Diagnose Chat</Link>
        <Link href="/dashboard/pools/demo/history" className="card block">Pool History</Link>
      </div>
    </div>
  );
}
