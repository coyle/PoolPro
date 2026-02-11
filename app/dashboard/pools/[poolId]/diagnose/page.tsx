'use client';

import { useEffect, useState } from 'react';
import { csrfFetch } from '@/lib/csrf-client';

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
      const res = await csrfFetch(`/api/pools/${params.poolId}/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          context: {
            poolVolumeGallons: poolContext?.volumeGallons,
            surfaceType: poolContext?.surfaceType,
            sanitizerType: poolContext?.sanitizerType,
            isSalt: poolContext?.isSalt,
            latestTest: latestTest || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Diagnose failed');
      setResult(await res.json());
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
          {result.safetyAdjustments?.length > 0 && (
            <div>
              <p><b>Safety Adjustments:</b></p>
              <ul className="list-disc pl-5">
                {result.safetyAdjustments.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          <p><b>Retest:</b> {result.plan?.retest_in_hours} hours</p>
          <div>
            <p><b>Steps</b></p>
            <ul className="list-disc pl-5">{result.plan?.steps?.map((s: string, i: number)=><li key={i}>{s}</li>)}</ul>
          </div>
          <div>
            <p><b>Chemical Additions</b></p>
            <ul className="list-disc pl-5">
              {result.plan?.chemical_additions?.map((c: any, i: number) => (
                <li key={i}>
                  {c.chemical}: {c.amount} {c.unit} - {c.instructions}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p><b>Safety Notes</b></p>
            <ul className="list-disc pl-5">{result.plan?.safety_notes?.map((s: string, i: number)=><li key={i}>{s}</li>)}</ul>
          </div>
          <div>
            <p><b>When To Call A Pro</b></p>
            <ul className="list-disc pl-5">{result.plan?.when_to_call_pro?.map((s: string, i: number)=><li key={i}>{s}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
