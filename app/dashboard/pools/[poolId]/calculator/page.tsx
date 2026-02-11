'use client';

import { useState } from 'react';
import { calculateDosing } from '@/lib/chemistry/dosing';

export default function CalculatorPage() {
  const [volume, setVolume] = useState(15000);
  const [fc, setFc] = useState(1);
  const [fcTarget, setFcTarget] = useState(4);
  const [ph, setPh] = useState(8);
  const [phTarget, setPhTarget] = useState(7.5);
  const [ta, setTa] = useState(80);
  const [taTarget, setTaTarget] = useState(100);
  const [ch, setCh] = useState(200);
  const [chTarget, setChTarget] = useState(275);
  const [cya, setCya] = useState(20);
  const [cyaTarget, setCyaTarget] = useState(40);

  const result = calculateDosing({
    poolVolumeGallons: volume,
    readings: { fc, ph, ta, ch, cya },
    targets: { fc: fcTarget, ph: phTarget, ta: taTarget, ch: chTarget, cya: cyaTarget },
  });

  return (
    <div className="space-y-4">
      <div className="card text-sm text-amber-700">Always retest after each adjustment. Never mix chemicals together.</div>
      <div className="card grid grid-cols-2 gap-2 text-sm">
        <label className="label">Volume</label><input className="input" value={volume} onChange={(e)=>setVolume(Number(e.target.value))} />
        <label className="label">FC</label><input className="input" value={fc} onChange={(e)=>setFc(Number(e.target.value))} />
        <label className="label">FC target</label><input className="input" value={fcTarget} onChange={(e)=>setFcTarget(Number(e.target.value))} />
        <label className="label">pH</label><input className="input" value={ph} onChange={(e)=>setPh(Number(e.target.value))} />
        <label className="label">pH target</label><input className="input" value={phTarget} onChange={(e)=>setPhTarget(Number(e.target.value))} />
        <label className="label">TA</label><input className="input" value={ta} onChange={(e)=>setTa(Number(e.target.value))} />
        <label className="label">TA target</label><input className="input" value={taTarget} onChange={(e)=>setTaTarget(Number(e.target.value))} />
        <label className="label">CH</label><input className="input" value={ch} onChange={(e)=>setCh(Number(e.target.value))} />
        <label className="label">CH target</label><input className="input" value={chTarget} onChange={(e)=>setChTarget(Number(e.target.value))} />
        <label className="label">CYA</label><input className="input" value={cya} onChange={(e)=>setCya(Number(e.target.value))} />
        <label className="label">CYA target</label><input className="input" value={cyaTarget} onChange={(e)=>setCyaTarget(Number(e.target.value))} />
      </div>
      <div className="card">
        <p className="font-semibold">Confidence: {result.confidence}</p>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {result.doses.map((d, idx)=><li key={idx}>{d.chemical}: {d.amount} {d.unit} — {d.notes}</li>)}
        </ul>
      </div>
    </div>
  );
}
