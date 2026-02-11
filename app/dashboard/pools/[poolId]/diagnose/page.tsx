'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function DiagnosePage({ params }: { params: { poolId: string } }) {
  const [symptoms, setSymptoms] = useState('Cloudy water and chlorine smell');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      setError('');
      const data = await apiFetch('/diagnose', {
        method: 'POST',
        body: JSON.stringify({ poolId: params.poolId, symptoms }),
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card text-sm text-amber-700">Safety: conservative guidance only. Always retest before adding more chemicals.</div>
      <div className="card space-y-2">
        <label className="label">Symptoms</label>
        <textarea className="input" rows={4} value={symptoms} onChange={(e)=>setSymptoms(e.target.value)} />
        <button onClick={submit} className="btn-primary">Get Plan</button>
      </div>
      {error && <div className="card text-red-600 text-sm">{error}</div>}
      {result && (
        <div className="card space-y-2 text-sm">
          <p><b>Diagnosis:</b> {result.plan?.diagnosis}</p>
          <p><b>Confidence:</b> {result.plan?.confidence}</p>
          <p><b>Retest:</b> {result.plan?.retest_in_hours} hours</p>
          <ul className="list-disc pl-5">{result.plan?.steps?.map((s: string, i: number)=><li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
