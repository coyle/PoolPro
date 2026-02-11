import Link from 'next/link';

export default function CustomerPage({ params }: { params: { customerId: string } }) {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Customer {params.customerId}</h1>
      <Link className="btn-primary inline-block" href="/dashboard/pools/demo/calculator">Continue to Pool</Link>
    </div>
  );
}
