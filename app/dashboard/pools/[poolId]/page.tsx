import Link from 'next/link';

export default function PoolPage({ params }: { params: { poolId: string } }) {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Pool {params.poolId}</h1>
      <div className="grid gap-2">
        <Link className="card" href={`/dashboard/pools/${params.poolId}/calculator`}>Calculator</Link>
        <Link className="card" href={`/dashboard/pools/${params.poolId}/diagnose`}>Diagnose Chat</Link>
        <Link className="card" href={`/dashboard/pools/${params.poolId}/history`}>History Timeline</Link>
      </div>
    </div>
  );
}
