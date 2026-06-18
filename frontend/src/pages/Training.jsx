import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Training() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/training/completion").then(({ data }) => setData(data)); }, []);

  return (
    <div className="space-y-10">
      <div>
        <div className="num-mono text-[11px] tracking-[0.28em] text-ink-400">FEATURE · 06</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3">Training completion</h1>
        <p className="font-serif text-lg text-ink-500 mt-2">Module-level telemetry across every Skill Tank program.</p>
      </div>

      {/* Program summary */}
      <div className="grid grid-cols-12 gap-6">
        {(data?.by_program || []).map((p) => (
          <div key={p.program_code} className="col-span-12 md:col-span-6 lg:col-span-4 border border-line bg-bone-50 p-8 bento-card" data-testid={`program-${p.program_code}`}>
            <div className="num-mono text-[10px] tracking-[0.24em] text-ink-400">PROGRAM · {p.program_code}</div>
            <h3 className="font-display text-2xl tracking-tight mt-2">{p.program_name}</h3>
            <div className="font-display text-6xl tracking-tightest mt-6"><span className="num-mono">{p.avg_completion}</span>%</div>
            <div className="text-sm text-ink-500 mt-1">avg completion</div>
            <div className="hairline my-6" />
            <div className="grid grid-cols-3 text-sm">
              <div>
                <div className="num-mono text-[10px] text-ink-400 tracking-[0.2em]">DONE</div>
                <div className="font-display text-2xl text-accent">{p.completed}</div>
              </div>
              <div>
                <div className="num-mono text-[10px] text-ink-400 tracking-[0.2em]">ACTIVE</div>
                <div className="font-display text-2xl">{p.in_progress}</div>
              </div>
              <div>
                <div className="num-mono text-[10px] text-ink-400 tracking-[0.2em]">TOTAL</div>
                <div className="font-display text-2xl">{p.enrolled}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student rows */}
      <div className="border border-line bg-bone-50" data-testid="training-rows">
        <div className="p-8 border-b border-line">
          <div className="num-mono text-[10px] tracking-[0.24em] text-ink-400">STUDENT LEVEL · TOP 80 BY COMPLETION</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Individual progress</h3>
        </div>
        <div className="grid grid-cols-12 px-8 py-3 border-b border-line num-mono text-[10px] tracking-[0.24em] text-ink-400">
          <div className="col-span-3">STUDENT</div>
          <div className="col-span-2">ROLL</div>
          <div className="col-span-1">DEPT</div>
          <div className="col-span-2">PROGRAM</div>
          <div className="col-span-3">COMPLETION</div>
          <div className="col-span-1 text-right">STATUS</div>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {(data?.rows || []).map((r, i) => (
            <div key={r.enrollment_id} className="grid grid-cols-12 px-8 py-3 border-b border-line items-center text-sm" data-testid={`training-row-${i}`}>
              <div className="col-span-3 font-medium">{r.student_name}</div>
              <div className="col-span-2 num-mono text-xs">{r.roll_number}</div>
              <div className="col-span-1"><span className="pill bg-bone-100">{r.department}</span></div>
              <div className="col-span-2">{r.program_code}</div>
              <div className="col-span-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-bone-300 relative">
                    <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${r.completion_pct}%` }} />
                  </div>
                  <span className="num-mono text-xs w-12 text-right">{r.completion_pct}%</span>
                </div>
              </div>
              <div className="col-span-1 text-right num-mono text-[10px] uppercase">
                {r.status === "completed" ? <span className="text-accent">● done</span> : r.status === "in_progress" ? "● active" : "○ enrolled"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
