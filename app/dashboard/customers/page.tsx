import Link from 'next/link';

export default function CustomersPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Customers</h1>
      <div className="card text-sm">Demo customer loaded from seed data.</div>
      <Link href="/dashboard/customers/demo" className="btn-primary inline-block">Open Demo Customer</Link>
    </div>
  );
}
