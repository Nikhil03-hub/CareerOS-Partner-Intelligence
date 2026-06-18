import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Cohorts() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/cohorts").then(({ data }) => setData(data)); }, []);

  return (
    <div className="space-y-10">
      <div>
        <div className="num-mono text-[11px] tracking-[0.28em] text-ink-400">FEATURE · 04</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3">Programs · cohorts</h1>
        <p className="font-serif text-lg text-ink-500 mt-2">CRT · Interview Master · FDP · DSA · Aptitude — your training portfolio in real-time.</p>
      </div>

      <div className="grid grid-cols-12 gap-6" data-testid="cohort-grid">
        {(data?.items || []).map((c, i) => {
          const ring = c.completion_pct;
          return (
            <div key={c.cohort_id} className="col-span-12 md:col-span-6 lg:col-span-4 border border-line bg-bone-50 p-8 bento-card" data-testid={`cohort-${c.program_code}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="num-mono text-[10px] tracking-[0.24em] text-ink-400">PROGRAM · {c.program_code}</div>
                  <h3 className="font-display text-3xl tracking-tight mt-2">{c.program_name}</h3>
                  <div className="text-sm text-ink-500 mt-1">{c.batch_label}</div>
                </div>
                <ProgressRing pct={ring} />
              </div>
              <div className="hairline my-6" />
              <div className="grid grid-cols-3 gap-4">
                <Stat label="Enrolled" value={c.enrolled_count} />
                <Stat label="Modules" value={c.modules_total} />
                <Stat label="Instructor" value={c.instructor?.split(" ")[0] + " " + (c.instructor?.split(" ")[1] || "")} mono={false} small />
              </div>
              <div className="num-mono text-[10px] tracking-[0.24em] text-ink-400 mt-6">
                {c.start_date?.slice(0, 10)} → {c.end_date?.slice(0, 10)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, mono = true, small }) {
  return (
    <div>
      <div className="num-mono text-[9px] tracking-[0.24em] text-ink-400">{label.toUpperCase()}</div>
      <div className={`${mono ? "num-mono" : "font-display"} ${small ? "text-base" : "text-2xl"} mt-1`}>{value}</div>
    </div>
  );
}

function ProgressRing({ pct }) {
  const r = 30; const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative w-[80px] h-[80px]">
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(17,17,17,0.1)" strokeWidth="4" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1538C8" strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 40 40)" />
      </svg>
      <div className="absolute inset-0 grid place-items-center num-mono text-sm font-semibold">{Math.round(pct)}%</div>
    </div>
  );
}
