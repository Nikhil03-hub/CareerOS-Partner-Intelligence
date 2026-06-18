import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Code2, TrendingUp, Trophy } from "lucide-react";

export default function DSAIntelligence() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/dsa/intelligence").then(({ data }) => setD(data)); }, []);
  if (!d) return <div className="font-mono text-xs text-ink-400">LOADING DSA …</div>;

  const total = d.total_problems;
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-8 editorial p-10 lg:p-12">
          <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ DSA · STRIVER A2Z</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="dsa-heading">
            {d.scope?.startsWith("department:") ? (
              <>Department <span className="text-accent">DSA pulse.</span></>
            ) : (
              <>Institutional DSA <span className="text-accent">readiness map.</span></>
            )}
          </h1>
          <p className="font-serif text-lg text-ink-500 mt-3 max-w-xl">
            {d.scope?.startsWith("department:")
              ? `Scoped to your department (${d.scope.split(":")[1]}). Every Striver topic, every student you teach.`
              : "Every Striver topic. Every student. Every solve. Use the topic map to find weak areas and the leaderboard to find your top contenders."}
          </p>
          {d.scope?.startsWith("department:") && (
            <div className="mt-4 inline-flex pill" data-testid="dsa-scope-badge" style={{ color: "#4a5d3a", borderColor: "#4a5d3a" }}>
              FACULTY SCOPE · {d.scope.split(":")[1]}
            </div>
          )}
        </div>
        <div className="col-span-12 md:col-span-4 editorial bg-ink-900 text-bone-100 p-10">
          <div className="font-mono text-[10px] tracking-[0.28em] text-bone-100/40">PROBLEMS · SHEET TOTAL</div>
          <div className="font-display text-[8vw] md:text-[6vw] tracking-tightest leading-[0.9] tnum">{total}</div>
          <div className="text-bone-100/60 text-sm">across 19 topics</div>
        </div>
      </div>

      {/* Topics heatmap */}
      <div className="editorial p-8" data-testid="dsa-topics">
        <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">TOPICS · INSTITUTIONAL AVERAGE</div>
        <h3 className="font-display text-2xl tracking-tight mt-1">Topic mastery map</h3>
        <div className="mt-6 grid grid-cols-12 gap-3">
          {d.by_topic.map((t) => {
            const pct = t.students && t.total ? Math.round((t.solved / (t.students * t.total)) * 100) : 0;
            return (
              <div key={t._id} className="col-span-6 md:col-span-4 lg:col-span-3 border border-line p-5 bg-bone-50" data-testid={`dsa-topic-${t._id}`}>
                <div className="font-mono text-[10px] tracking-[0.2em] text-ink-400">{t._id}</div>
                <div className="font-display text-xl tracking-tight mt-1">{t.topic_name}</div>
                <div className="font-display text-4xl mt-3 tnum">{pct}%</div>
                <div className="mt-3 h-1.5 bg-bone-300 relative">
                  <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: pct >= 60 ? "#0a0a0a" : pct >= 30 ? "#d4a017" : "#ff3b00" }} />
                </div>
                <div className="text-xs text-ink-500 mt-2 tnum">{t.solved} solves · {t.students} students · {t.total} problems</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="editorial" data-testid="dsa-leaderboard">
        <div className="p-6 border-b border-line">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">LEADERBOARD · TOP 20</div>
          <h3 className="font-display text-2xl tracking-tight mt-1 flex items-center gap-3"><Trophy size={20} className="text-accent" /> Most solves</h3>
        </div>
        <div className="grid grid-cols-12 px-6 py-3 border-b border-line font-mono text-[10px] tracking-[0.24em] text-ink-400">
          <div className="col-span-1">#</div>
          <div className="col-span-4">STUDENT</div>
          <div className="col-span-2">ROLL</div>
          <div className="col-span-2">DEPT</div>
          <div className="col-span-2 text-right">SOLVED</div>
          <div className="col-span-1 text-right">READINESS</div>
        </div>
        {d.leaderboard.map((s, i) => (
          <div key={s.student_id} className="grid grid-cols-12 px-6 py-4 border-b border-line items-center hover:bg-bone-200 transition-colors" data-testid={`dsa-leader-${i}`}>
            <div className="col-span-1 font-mono text-sm text-ink-400">{String(i + 1).padStart(2, "0")}</div>
            <div className="col-span-4 font-medium">{s.name}</div>
            <div className="col-span-2 font-mono text-sm tnum">{s.roll_number}</div>
            <div className="col-span-2"><span className="pill bg-bone-100">{s.department}</span></div>
            <div className="col-span-2 text-right font-mono tnum">{s.solved}<span className="text-ink-400">/{total}</span></div>
            <div className="col-span-1 text-right font-mono text-accent tnum">{s.readiness}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
