import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../App";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { ArrowUpRight } from "lucide-react";

/* Generic editorial overview — TPO / Institution Admin home */
export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [training, setTraining] = useState(null);
  const [dsa, setDsa] = useState(null);

  useEffect(() => {
    api.get("/placements/overview").then(({ data }) => setData(data));
    api.get("/training/completion").then(({ data }) => setTraining(data));
    api.get("/dsa/intelligence").then(({ data }) => setDsa(data));
  }, []);

  const latest = data?.year_summaries?.[0];
  const rate = data ? Math.round((data.students_placed / Math.max(1, data.students_total)) * 100) : 0;
  const dsaTotal = dsa?.total_problems || 455;
  const dsaAvg = dsa?.by_topic ? Math.round(dsa.by_topic.reduce((a, t) => a + (t.solved / t.students / t.total), 0) / Math.max(1, dsa.by_topic.length) * 100) : 0;

  return (
    <div className="space-y-10">
      {/* Hero / banner */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-8 editorial p-10 lg:p-14 relative overflow-hidden">
          <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ MISSION CONTROL · LIVE</div>
          <h1 className="font-display text-5xl md:text-7xl tracking-tightest mt-3 leading-[0.95]" data-testid="overview-heading">
            Good morning, <span className="text-accent">{(user?.name || "TPO").split(/[\s.]+/).find((w) => w && w.length > 1 && !/^(Dr|Mr|Mrs|Ms|Prof)$/i.test(w)) || "TPO"}.</span>
          </h1>
          <p className="font-serif text-lg text-ink-500 mt-3 max-w-2xl">
            Here's what's happening across your placement pipeline this morning.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <span className="pill">AY · {latest?.academic_year || "2025-26"}</span>
            <span className="pill pill-solid">{latest?.companies || 148} recruiters live</span>
            <span className="pill">avg ₹{latest?.avg_lpa?.toFixed(2)} L</span>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 editorial bg-ink-900 text-bone-100 p-8 lg:p-10 flex flex-col justify-between" data-testid="kpi-top-right">
          <div>
            <div className="font-mono text-[10px] tracking-[0.28em] text-bone-100/40">TOP OFFER · CURRENT YEAR</div>
            <div className="font-display text-[8vw] md:text-[6vw] tracking-tightest mt-3 leading-[0.9] text-accent tnum">₹{latest?.top_offer_lpa || 0}<span className="text-bone-100">L</span></div>
            <div className="text-bone-100/70 mt-2">{latest?.top_company} · SDE</div>
          </div>
          <div className="hairline border-bone-100/20 my-5" />
          <div>
            <div className="font-mono text-[10px] tracking-[0.28em] text-bone-100/40">PLACEMENT RATE</div>
            <div className="font-display text-5xl mt-2 tnum">{rate}%</div>
            <div className="text-bone-100/60 text-sm">{data?.students_placed || 0} of {data?.students_total || 0} placed</div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-12 gap-3" data-testid="kpi-grid">
        {[
          { label: "Offers · this year", val: latest?.offers, sub: `${latest?.companies} recruiters`, color: "#0a0a0a" },
          { label: "Avg CTC", val: latest?.avg_lpa, prefix: "₹", suffix: " L", decimals: 2, sub: `Top ₹${latest?.top_offer_lpa}L · ${latest?.top_company}`, color: "#0a0a0a" },
          { label: "Training avg", val: training ? Math.round(training.by_program.reduce((a, b) => a + b.avg_completion, 0) / Math.max(1, training.by_program.length)) : 0, suffix: "%", sub: `${training?.by_program?.length || 0} programs`, color: "#0a0a0a" },
          { label: "Top recruiter (ATS)", val: data?.top_recruiters?.[0]?.selects, suffix: " selects", sub: data?.top_recruiters?.[0]?.company || "—", color: "#0a0a0a" },
        ].map((k) => (
          <div key={k.label} className="col-span-12 md:col-span-3 editorial p-6">
            <div className="flex items-center justify-between text-ink-400">
              <div className="font-mono text-[10px] tracking-[0.24em]">{k.label.toUpperCase()}</div>
              <ArrowUpRight size={14} />
            </div>
            <div className="font-display text-5xl tracking-tightest mt-4 tnum">
              {k.prefix || ""}{Number(k.val ?? 0).toLocaleString(undefined, { minimumFractionDigits: k.decimals || 0, maximumFractionDigits: k.decimals || 0 })}{k.suffix || ""}
            </div>
            <div className="text-sm text-ink-500 mt-2">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* YoY bar + Top recruiters + Dept */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-8 editorial p-8" data-testid="yoy-card">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">YEAR OVER YEAR</div>
              <h3 className="font-display text-2xl tracking-tight mt-1">Offers trajectory · 2017 → 2026</h3>
            </div>
            <span className="font-mono text-[11px] text-ink-400">SOURCE · INSTITUTIONAL</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={[...(data?.year_summaries || [])].reverse()}>
                <CartesianGrid stroke="rgba(10,10,10,0.06)" vertical={false} />
                <XAxis dataKey="academic_year" tick={{ fill: "#888", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#888", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: "1px solid rgba(10,10,10,0.2)", borderRadius: 0, background: "#FFF", fontFamily: "Satoshi" }} />
                <Bar dataKey="offers" fill="#0a0a0a" />
                <Bar dataKey="companies" fill="#FF3B00" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 editorial bg-ink-900 text-bone-100 p-8" data-testid="top-recruiters-card">
          <div className="font-mono text-[10px] tracking-[0.24em] text-bone-100/40">TOP RECRUITERS</div>
          <div className="space-y-px mt-5">
            {(data?.top_recruiters || []).slice(0, 7).map((r, i) => (
              <div key={r.company} className="flex items-center justify-between py-3 border-b border-bone-100/10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-bone-100/40 tnum w-6">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display tracking-tight">{r.company}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm tnum">{r.selects}</div>
                  <div className="font-mono text-[10px] text-accent tnum">₹{r.max_ctc?.toFixed(1)}L</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dept + DSA glance */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-7 editorial p-8" data-testid="dept-card">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">BY DEPARTMENT</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Placement breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {(data?.department_breakdown || []).slice(0, 4).map((d) => {
              const pct = d.total ? Math.round((d.placed / d.total) * 100) : 0;
              return (
                <div key={d.department} className="border border-line p-5 bg-bone-50" data-testid={`dept-${d.department}`}>
                  <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">{d.department}</div>
                  <div className="font-display text-4xl mt-2 tnum">{pct}%</div>
                  <div className="text-xs text-ink-500 mt-1">{d.placed}/{d.total}</div>
                  <div className="mt-3 h-1 bg-bone-300 relative">
                    <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="col-span-12 md:col-span-5 editorial p-8 bg-bone-50">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">DSA INTELLIGENCE · GLANCE</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Striver A2Z · 455 problems</h3>
          <div className="font-display text-7xl tracking-tightest mt-6 tnum">{dsaAvg}%</div>
          <div className="text-ink-500 text-sm">Average problems solved (institutional)</div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="font-mono text-[10px] text-ink-400 tracking-[0.2em]">TOPICS</div>
              <div className="font-display text-2xl mt-1">{dsa?.by_topic?.length || 0}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-ink-400 tracking-[0.2em]">LEADERS</div>
              <div className="font-display text-2xl mt-1">{dsa?.leaderboard?.length || 0}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-ink-400 tracking-[0.2em]">PROBLEMS</div>
              <div className="font-display text-2xl mt-1">{dsaTotal}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
