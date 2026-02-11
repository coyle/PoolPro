'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type PoolContext = {
  volumeGallons?: number;
  surfaceType?: string;
  sanitizerType?: string;
  isSalt?: boolean;
};

type LatestTest = {
  testedAt?: string;
  fc?: number | null;
  cc?: number | null;
  ph?: number | null;
  ta?: number | null;
  ch?: number | null;
  cya?: number | null;
  salt?: number | null;
  tempF?: number | null;
};

export default function DiagnosePage({ params }: { params: { poolId: string } }) {
  const [symptoms, setSymptoms] = useState('Cloudy water and chlorine smell');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [poolContext, setPoolContext] = useState<PoolContext | null>(null);
  const [latestTest, setLatestTest] = useState<LatestTest | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingContext(true);
        const [poolRes, testsRes] = await Promise.all([
          fetch(`/api/pools/${params.poolId}`, { cache: 'no-store' }),
          fetch(`/api/pools/${params.poolId}/water-tests?limit=1`, { cache: 'no-store' }),
        ]);

        if (poolRes.ok) {
          const poolData = await poolRes.json();
          if (poolData.pool) {
            setPoolContext({
              volumeGallons: poolData.pool.volumeGallons,
              surfaceType: poolData.pool.surfaceType,
              sanitizerType: poolData.pool.sanitizerType,
              isSalt: poolData.pool.isSalt,
            });
          }
        }

        if (testsRes.ok) {
          const testsData = await testsRes.json();
          const t = testsData.tests?.[0];
          if (t) {
            setLatestTest({
              testedAt: t.testedAt,
              fc: t.fc,
              cc: t.cc,
              ph: t.ph,
              ta: t.ta,
              ch: t.ch,
              cya: t.cya,
              salt: t.salt,
              tempF: t.tempF,
            });
          }
        }
      } finally {
        setLoadingContext(false);
      }
    };

    run();
  }, [params.poolId]);

  const submit = async () => {
    try {
      setError('');
      const data = await apiFetch('/diagnose', {
        method: 'POST',
        body: JSON.stringify({
          poolId: params.poolId,
          symptoms,
          context: {
            ...(poolContext || {}),
            latestTest: latestTest || undefined,
          },
        }),
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card text-sm text-amber-700">Safety: conservative guidance only. Always retest before adding more chemicals.</div>
      <div className="card text-sm text-slate-600">
        {loadingContext
          ? 'Loading pool context for better diagnose quality...'
          : `Context loaded: ${poolContext ? 'pool profile' : 'no pool profile'}${latestTest ? ' + latest water test' : ''}.`}
      </div>
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
          <p><b>Source:</b> {result.source || 'fallback'}</p>
          {result.warning && <p className="text-amber-700"><b>Note:</b> {result.warning}</p>}
          <p><b>Retest:</b> {result.plan?.retest_in_hours} hours</p>
          <ul className="list-disc pl-5">{result.plan?.steps?.map((s: string, i: number)=><li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
