import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function TalentPool() {
  const [items, setItems] = useState([]);
  const [minCgpa, setMinCgpa] = useState(7.0);

  const load = (cg = minCgpa) => {
    api.get(`/recruiters/rec_amazon/talent-pool?min_cgpa=${cg}`).then(({ data }) => setItems(data.items || []));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ TALENT POOL</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="talent-heading">
            Filter the <span className="text-accent">institutional pool.</span>
          </h1>
        </div>
        <div className="border border-line bg-bone-50 px-4 py-3 flex items-center gap-3">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">MIN CGPA</div>
          <input type="number" step="0.1" min="6" max="10" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)}
            data-testid="talent-cgpa" className="bg-transparent font-display text-2xl w-16 focus:outline-none tnum" />
          <button onClick={() => load(minCgpa)} className="btn py-2 px-4 text-xs" data-testid="talent-apply">Apply</button>
        </div>
      </div>

      <div className="editorial">
        <div className="grid grid-cols-12 px-6 py-3 border-b border-line font-mono text-[10px] tracking-[0.24em] text-ink-400">
          <div className="col-span-3">STUDENT</div>
          <div className="col-span-2">ROLL</div>
          <div className="col-span-2">DEPT</div>
          <div className="col-span-1 text-right">CGPA</div>
          <div className="col-span-1 text-right">READINESS</div>
          <div className="col-span-1 text-right">ATS</div>
          <div className="col-span-2">SKILLS</div>
        </div>
        {items.map((s, i) => (
          <div key={s.student_id} className="grid grid-cols-12 px-6 py-4 border-b border-line items-center text-sm hover:bg-bone-200 transition-colors" data-testid={`talent-row-${i}`}>
            <div className="col-span-3 font-medium">{s.name}</div>
            <div className="col-span-2 font-mono text-xs tnum">{s.roll_number}</div>
            <div className="col-span-2"><span className="pill bg-bone-100 text-[9px]">{s.department}</span></div>
            <div className="col-span-1 text-right font-display tnum">{s.cgpa}</div>
            <div className="col-span-1 text-right font-display text-accent tnum">{s.readiness_score}</div>
            <div className="col-span-1 text-right font-display tnum">{s.ats_score}</div>
            <div className="col-span-2 text-xs text-ink-500 truncate">{(s.skills || []).slice(0, 4).join(" · ")}</div>
          </div>
        ))}
        {items.length === 0 && <div className="px-6 py-12 text-center text-ink-400">No candidates above {minCgpa} CGPA.</div>}
      </div>
    </div>
  );
}
