import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis } from "recharts";

export default function Outcomes() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/placements/overview").then(({ data }) => setData(data)); }, []);

  const ctcTrend = [...(data?.year_summaries || [])].reverse().map((y) => ({
    year: y.academic_year,
    avg: y.avg_lpa,
    top: y.top_offer_lpa,
  }));

  return (
    <div className="space-y-10">
      <div>
        <div className="num-mono text-[11px] tracking-[0.28em] text-ink-400">FEATURE · 05</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3">Placement outcomes</h1>
        <p className="font-serif text-lg text-ink-500 mt-2">Year-over-year intelligence across recruiters, departments and CTC bands.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-8 border border-line bg-bone-50 p-8" data-testid="ctc-trend-card">
          <div className="num-mono text-[10px] tracking-[0.24em] text-ink-400">CTC TREND · AVG vs TOP OFFER</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Decade of compensation</h3>
          <div className="h-72 mt-6">
            <ResponsiveContainer>
              <LineChart data={ctcTrend}>
                <CartesianGrid stroke="rgba(17,17,17,0.06)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#888", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: "1px solid rgba(17,17,17,0.2)", borderRadius: 0, background: "#FFF" }} />
                <Line type="monotone" dataKey="avg" stroke="#0E0E10" strokeWidth={2} dot={{ r: 3, fill: "#0E0E10" }} name="Avg LPA" />
                <Line type="monotone" dataKey="top" stroke="#D97706" strokeWidth={2.5} dot={{ r: 4, fill: "#D97706" }} name="Top LPA" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 border border-bone-100/12 bg-ink-900 text-bone-100 p-8" data-testid="dept-mix-card">
          <div className="num-mono text-[10px] tracking-[0.24em] text-bone-100/40">DEPARTMENT MIX</div>
          <div className="space-y-4 mt-6">
            {(data?.department_breakdown || []).map((d) => {
              const pct = d.total ? Math.round((d.placed / d.total) * 100) : 0;
              return (
                <div key={d.department}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{d.department}</span>
                    <span className="num-mono text-bone-100/60">{d.placed}/{d.total} · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-bone-100/10">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recruiter ledger */}
        <div className="col-span-12 border border-bone-100/12 bg-bone-50" data-testid="recruiter-ledger">
          <div className="p-8 border-b border-line">
            <div className="num-mono text-[10px] tracking-[0.24em] text-bone-100/45">RECRUITER LEDGER · ALL YEARS</div>
            <h3 className="font-display text-2xl tracking-tight mt-1">Every selection on record</h3>
          </div>
          <div className="grid grid-cols-12 px-8 py-3 border-b border-bone-100/12 num-mono text-[10px] tracking-[0.24em] text-bone-100/45">
            <div className="col-span-2">YEAR</div>
            <div className="col-span-5">COMPANY</div>
            <div className="col-span-3 text-right">SELECTS</div>
            <div className="col-span-2 text-right">CTC</div>
          </div>
          <div className="max-h-[440px] overflow-y-auto">
            {(data?.records || []).map((r, i) => (
              <div key={r.record_id} className="grid grid-cols-12 px-8 py-3 border-b border-bone-100/12 items-center hover:bg-bone-100 transition-colors text-sm" data-testid={`ledger-row-${i}`}>
                <div className="col-span-2 num-mono text-ink-400">{r.academic_year}</div>
                <div className="col-span-5 font-medium">{r.company}</div>
                <div className="col-span-3 text-right num-mono">{r.selects}</div>
                <div className="col-span-2 text-right num-mono text-accent">₹{r.ctc_lpa?.toFixed(1)}L</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
