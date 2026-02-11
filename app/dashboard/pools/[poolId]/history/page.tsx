'use client';

import { useEffect, useState } from 'react';

type TimelineItem = { type: 'water_test' | 'treatment_plan'; at: string; data: any };

export default function HistoryPage({ params }: { params: { poolId: string } }) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [compare, setCompare] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/pools/${params.poolId}/timeline`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'Failed to load timeline');
        return r.json();
      })
      .then((d) => {
        setTimeline(d.timeline || []);
        setCompare(d.compare);
      })
      .catch((e) => setError(e.message));
  }, [params.poolId]);

  const repeatPlan = async (id: string) => {
    const res = await fetch(`/api/treatment-plans/${id}/repeat`, { method: 'POST' });
    if (!res.ok) return setError((await res.json()).error || 'Repeat failed');
    location.reload();
  };

  return (
    <div className="space-y-3">
      <div className="card text-sm text-amber-700">History supports compare last two tests and repeat last plan.</div>
      {compare && (
        <div className="card text-sm">
          <h2 className="font-semibold">Compare last 2 tests</h2>
          <p>FC: {compare.previous.fc ?? '-'} → {compare.latest.fc ?? '-'}</p>
          <p>pH: {compare.previous.ph ?? '-'} → {compare.latest.ph ?? '-'}</p>
          <p>TA: {compare.previous.ta ?? '-'} → {compare.latest.ta ?? '-'}</p>
        </div>
      )}
      {error && <div className="card text-sm text-red-600">{error}</div>}
      <div className="space-y-2">
        {timeline.map((item, i) => (
          <div className="card text-sm" key={i}>
            <p className="font-semibold">{item.type === 'water_test' ? 'Water Test' : 'Treatment Plan'}</p>
            <p className="text-slate-500">{new Date(item.at).toLocaleString()}</p>
            {item.type === 'water_test' ? (
              <p>FC {item.data.fc ?? '-'} | pH {item.data.ph ?? '-'} | CYA {item.data.cya ?? '-'}</p>
            ) : (
              <>
                <p>{item.data.diagnosis}</p>
                <button className="btn mt-2 border" onClick={() => repeatPlan(item.data.id)}>Repeat Last Plan</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
