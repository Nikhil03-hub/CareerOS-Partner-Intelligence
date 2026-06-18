import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function ATSIntelligence() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/ats/intelligence").then(({ data }) => setD(data)); }, []);
  if (!d) return <div className="font-mono text-xs text-ink-400">LOADING ATS…</div>;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-8 editorial p-10">
          <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ RESUME ATS · INTELLIGENCE</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="ats-heading">
            Every resume <span className="text-accent">scored.</span>
          </h1>
          <p className="font-serif text-lg text-ink-500 mt-2 max-w-xl">
            Keyword match, format quality, recruiter compatibility — institutional view across all uploaded resumes.
          </p>
        </div>
        <div className="col-span-12 md:col-span-4 editorial bg-ink-900 text-bone-100 p-10">
          <div className="font-mono text-[10px] tracking-[0.28em] text-bone-100/40">INSTITUTIONAL AVG</div>
          <div className="font-display text-[8vw] md:text-[6vw] tracking-tightest leading-[0.9] tnum text-accent">{d.avg_score}<span className="text-bone-100">%</span></div>
          <div className="text-bone-100/60 text-sm">{d.count} resumes scored</div>
        </div>
      </div>

      <div className="editorial" data-testid="ats-rows">
        <div className="p-6 border-b border-line">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">LATEST UPLOADS · TOP 40</div>
        </div>
        <div className="grid grid-cols-12 px-6 py-3 border-b border-line font-mono text-[10px] tracking-[0.24em] text-ink-400">
          <div className="col-span-3">STUDENT</div>
          <div className="col-span-2">ROLL</div>
          <div className="col-span-1">DEPT</div>
          <div className="col-span-2">FILE</div>
          <div className="col-span-1 text-right">SCORE</div>
          <div className="col-span-1 text-right">KW MATCH</div>
          <div className="col-span-2">MISSING</div>
        </div>
        {d.rows.map((r, i) => (
          <div key={r.ats_id} className="grid grid-cols-12 px-6 py-3 border-b border-line items-center text-sm hover:bg-bone-200 transition-colors" data-testid={`ats-${i}`}>
            <div className="col-span-3 font-medium">{r.student_name}</div>
            <div className="col-span-2 font-mono text-xs tnum">{r.roll_number}</div>
            <div className="col-span-1"><span className="pill bg-bone-100 text-[9px]">{r.department}</span></div>
            <div className="col-span-2 font-mono text-xs text-ink-500 truncate">{r.uploaded_filename}</div>
            <div className="col-span-1 text-right font-display text-xl tnum" style={{ color: r.score >= 80 ? "#0a0a0a" : r.score >= 60 ? "#d4a017" : "#ff3b00" }}>{r.score}</div>
            <div className="col-span-1 text-right font-mono tnum">{r.keyword_match_pct}%</div>
            <div className="col-span-2 text-xs text-ink-500 truncate">{(r.missing_keywords || []).join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
