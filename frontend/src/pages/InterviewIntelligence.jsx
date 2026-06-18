import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function InterviewIntelligence() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/interviews/intelligence").then(({ data }) => setD(data)); }, []);
  if (!d) return <div className="font-mono text-xs text-ink-400">LOADING…</div>;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-8 editorial p-10">
          <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ INTERVIEW AI</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="int-heading">
            Mock interviews, <span className="text-accent">measured.</span>
          </h1>
          <p className="font-serif text-lg text-ink-500 mt-2 max-w-xl">
            Confidence, communication, technical depth, body language — every mock leaves a fingerprint.
          </p>
        </div>
        <div className="col-span-12 md:col-span-4 grid grid-rows-2 gap-3">
          <div className="editorial bg-ink-900 text-bone-100 p-8">
            <div className="font-mono text-[10px] tracking-[0.24em] text-bone-100/40">AVG CONFIDENCE</div>
            <div className="font-display text-6xl tnum mt-2">{d.avg_confidence}%</div>
          </div>
          <div className="editorial p-8">
            <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">AVG TECHNICAL</div>
            <div className="font-display text-6xl tnum mt-2 text-accent">{d.avg_technical}%</div>
          </div>
        </div>
      </div>

      <div className="editorial" data-testid="int-rows">
        <div className="grid grid-cols-12 px-6 py-3 border-b border-line font-mono text-[10px] tracking-[0.24em] text-ink-400">
          <div className="col-span-3">STUDENT</div>
          <div className="col-span-1">TYPE</div>
          <div className="col-span-1 text-right">CONF</div>
          <div className="col-span-1 text-right">COMM</div>
          <div className="col-span-1 text-right">TECH</div>
          <div className="col-span-1 text-right">BODY</div>
          <div className="col-span-1 text-right">SCORE</div>
          <div className="col-span-3">FEEDBACK</div>
        </div>
        {d.rows.map((r) => (
          <div key={r.interview_id} className="grid grid-cols-12 px-6 py-4 border-b border-line items-center text-sm" data-testid="int-row">
            <div className="col-span-3">
              <div className="font-medium">{r.student_name}</div>
              <div className="font-mono text-[10px] text-ink-400">{r.roll_number}</div>
            </div>
            <div className="col-span-1"><span className="pill bg-bone-100 text-[9px]">{r.type}</span></div>
            <div className="col-span-1 text-right font-mono tnum">{r.confidence_score}</div>
            <div className="col-span-1 text-right font-mono tnum">{r.communication_score}</div>
            <div className="col-span-1 text-right font-mono tnum">{r.technical_score}</div>
            <div className="col-span-1 text-right font-mono tnum">{r.body_language_score}</div>
            <div className="col-span-1 text-right font-display text-xl tnum text-accent">{r.overall_score}</div>
            <div className="col-span-3 text-xs text-ink-500 italic">{r.feedback}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
