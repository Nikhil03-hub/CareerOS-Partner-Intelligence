import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function AptitudeIntelligence() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/aptitude/intelligence").then(({ data }) => setD(data)); }, []);
  if (!d) return <div className="font-mono text-xs text-ink-400">LOADING APTITUDE…</div>;

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ APTITUDE INTELLIGENCE</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="apt-heading">
          Quant · Reasoning · Verbal · DI.
        </h1>
        <p className="font-serif text-lg text-ink-500 mt-2 max-w-xl">Section-level accuracy, speed, and weak-area discovery — drawn from every test ever taken.</p>
      </div>

      <div className="grid grid-cols-12 gap-3" data-testid="apt-sections">
        {d.by_section.map((s) => (
          <div key={s._id} className="col-span-12 md:col-span-6 editorial p-8 bg-bone-50" data-testid={`apt-${s._id}`}>
            <div className="font-mono text-[10px] tracking-[0.2em] text-ink-400">SECTION · {s._id}</div>
            <h3 className="font-display text-2xl tracking-tight mt-1">{s.section_name}</h3>
            <div className="grid grid-cols-3 gap-6 mt-6">
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-ink-400">AVG SCORE</div>
                <div className="font-display text-5xl mt-1 tnum">{s.avg_score}<span className="text-2xl">%</span></div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-ink-400">ACCURACY</div>
                <div className="font-display text-5xl mt-1 tnum text-accent">{s.avg_accuracy}%</div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-ink-400">TESTS</div>
                <div className="font-display text-5xl mt-1 tnum">{s.tests}</div>
              </div>
            </div>
            <div className="mt-5">
              <div className="h-2 bg-bone-300 relative">
                <div className="absolute inset-y-0 left-0 bg-ink-900" style={{ width: `${s.avg_score}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
