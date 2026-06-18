import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../App";
import { Code2, FileSearch, Brain, MessageSquare, TrendingUp, Award, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentHome() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/me/dashboard").then(({ data }) => setD(data)).catch(() => {}); }, []);
  if (!d) return <div className="font-mono text-xs text-ink-400">LOADING…</div>;

  const s = d.student;
  const solved = d.dsa.reduce((a, t) => a + t.solved, 0);
  const dsaPct = Math.round((solved / d.dsa_total) * 100);
  const aptAvg = d.aptitude.length ? Math.round(d.aptitude.reduce((a, x) => a + x.score_pct, 0) / d.aptitude.length) : 0;
  const intAvg = d.interviews.length ? Math.round(d.interviews.reduce((a, x) => a + x.overall_score, 0) / d.interviews.length) : 0;
  const readiness = s.readiness_score;

  return (
    <div className="space-y-10">
      {/* Editorial hero */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-7 editorial p-10 lg:p-14 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 font-display text-[20vw] leading-none text-bone-200 select-none">{s.name[0]}</div>
          <div className="relative font-mono text-[10px] tracking-[0.28em] text-ink-400">§ YOUR WORKSPACE</div>
          <h1 className="relative font-display text-5xl md:text-6xl tracking-tightest mt-3 leading-[0.95]" data-testid="student-heading">
            Hi <span className="text-accent">{s.name.split(" ")[0]}</span>.<br />Let's get you placed.
          </h1>
          <p className="relative font-serif text-lg text-ink-500 mt-3 max-w-xl">
            {s.placement?.placed
              ? `Placed at ${s.placement.company} (₹${s.placement.ctc_lpa}L). Now help your peers.`
              : `${dsaPct}% DSA done · ATS ${d.ats?.score || s.ats_score} · readiness ${readiness}/100. Keep going.`}
          </p>
          <div className="relative mt-5 flex flex-wrap gap-2">
            <span className="pill">{s.roll_number}</span>
            <span className="pill pill-solid">{s.department}</span>
            <span className="pill">CGPA {s.cgpa}</span>
            <span className="pill">{s.batch}</span>
          </div>
        </div>
        <div className="col-span-12 md:col-span-5 editorial bg-ink-900 text-bone-100 p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.28em] text-bone-100/40">READINESS SCORE</div>
            <div className="font-display text-[14vw] md:text-[10vw] tracking-tightest leading-[0.9] tnum text-accent">{readiness}</div>
            <div className="text-bone-100/60 text-sm">composite (CGPA · DSA · ATS · Interview)</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { l: "DSA", v: `${dsaPct}%` },
              { l: "ATS", v: d.ats?.score || s.ats_score },
              { l: "INT", v: `${intAvg}` },
            ].map((x) => (
              <div key={x.l}>
                <div className="font-mono text-[10px] text-bone-100/40 tracking-[0.2em]">{x.l}</div>
                <div className="font-display text-3xl mt-1 tnum">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 module rings */}
      <div className="grid grid-cols-12 gap-3" data-testid="student-modules">
        {[
          { to: "/student/dsa", icon: Code2, label: "DSA tracker", primary: `${dsaPct}%`, sub: `${solved}/${d.dsa_total} solved`, key: "dsa" },
          { to: "/student/jobs", icon: Briefcase, label: "Open drives", primary: d.recommended_jobs.length, sub: "matching your profile", key: "jobs" },
          { to: "/student/applications", icon: TrendingUp, label: "Applications", primary: d.applications.length, sub: `${d.applications.filter(a => a.stage === "Interview").length} interviews`, key: "apps" },
          { to: "/student/announcements", icon: Award, label: "Aptitude avg", primary: `${aptAvg}%`, sub: `${d.aptitude.length} sections`, key: "apt" },
        ].map((m) => (
          <Link key={m.key} to={m.to} className="col-span-12 md:col-span-3 editorial p-7 hover:border-ink-900 transition-colors group" data-testid={`stmod-${m.key}`}>
            <div className="flex items-center justify-between text-ink-400">
              <div className="font-mono text-[10px] tracking-[0.24em] flex items-center gap-2"><m.icon size={14} /> {m.label.toUpperCase()}</div>
            </div>
            <div className="font-display text-5xl tracking-tightest mt-4 tnum group-hover:text-accent transition-colors">{m.primary}</div>
            <div className="text-sm text-ink-500 mt-1">{m.sub}</div>
          </Link>
        ))}
      </div>

      {/* DSA breakdown + Recommended jobs */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-7 editorial p-8" data-testid="student-dsa-panel">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">YOUR STRIVER A2Z · TOPIC PROGRESS</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Where you stand</h3>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
            {d.dsa.slice(0, 9).map((t) => {
              const pct = Math.round((t.solved / t.total) * 100);
              return (
                <div key={t.topic_code} className="border border-line p-4 bg-bone-50">
                  <div className="font-mono text-[10px] tracking-[0.2em] text-ink-400">{t.topic_code}</div>
                  <div className="font-display text-base tracking-tight mt-1 truncate">{t.topic_name}</div>
                  <div className="font-display text-2xl mt-2 tnum">{t.solved}<span className="text-ink-400">/{t.total}</span></div>
                  <div className="mt-2 h-1 bg-bone-300 relative">
                    <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/student/dsa" className="mt-6 inline-block ink-link text-sm">Open full tracker →</Link>
        </div>

        <div className="col-span-12 md:col-span-5 editorial p-8 bg-bone-50">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">RECOMMENDED FOR YOU</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Open drives</h3>
          <div className="mt-5 space-y-3">
            {d.recommended_jobs.map((j, i) => (
              <div key={j.job_id} className="border border-line p-4 bg-bone-100" data-testid={`rec-job-${i}`}>
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-lg tracking-tight">{j.company}</div>
                  <div className="font-mono text-accent tnum">₹{j.ctc_lpa}L</div>
                </div>
                <div className="text-xs text-ink-500">{j.title} · {j.location} · {j.openings} openings</div>
              </div>
            ))}
            {d.recommended_jobs.length === 0 && <div className="text-ink-400 text-sm">No matches right now.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
