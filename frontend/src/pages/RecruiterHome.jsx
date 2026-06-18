import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../App";

export default function RecruiterHome() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState(null);
  const [talent, setTalent] = useState([]);
  useEffect(() => {
    api.get("/jobs?status=open").then(({ data }) => setJobs(data.items || []));
    api.get("/applications").then(({ data }) => setApps(data));
    api.get("/recruiters/rec_amazon/talent-pool").then(({ data }) => setTalent(data.items || []));
  }, []);

  return (
    <div className="space-y-10">
      <div className="editorial bg-ink-900 text-bone-100 p-10 lg:p-14">
        <div className="font-mono text-[10px] tracking-[0.28em] text-bone-100/40">§ RECRUITER · CONSOLE</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="rec-home-heading">
          Hi {user?.name?.split(" ")[0]}, <span className="text-accent">your pipeline.</span>
        </h1>
        <p className="font-serif text-lg text-bone-100/70 mt-3 max-w-2xl">
          You see open drives, shortlisted candidates, and the talent pool across every partner institution.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-4 editorial p-7">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">OPEN DRIVES</div>
          <div className="font-display text-6xl tnum mt-2">{jobs.length}</div>
        </div>
        <div className="col-span-12 md:col-span-4 editorial p-7">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">IN PIPELINE</div>
          <div className="font-display text-6xl tnum mt-2 text-accent">{Object.values(apps?.pipeline || {}).reduce((a, b) => a + b, 0)}</div>
        </div>
        <div className="col-span-12 md:col-span-4 editorial p-7">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">TALENT POOL</div>
          <div className="font-display text-6xl tnum mt-2">{talent.length}</div>
        </div>
      </div>

      <div className="editorial p-8">
        <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">SHORTLISTED · NEXT 5</div>
        <h3 className="font-display text-2xl tracking-tight mt-1">Top of your pile</h3>
        <div className="mt-5 grid grid-cols-12 gap-3">
          {talent.slice(0, 6).map((t, i) => (
            <div key={t.student_id} className="col-span-12 md:col-span-6 lg:col-span-4 border border-line p-5 bg-bone-50" data-testid={`talent-${i}`}>
              <div className="font-display text-lg tracking-tight">{t.name}</div>
              <div className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">{t.department} · {t.roll_number}</div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                <div><div className="font-mono text-[10px] text-ink-400">CGPA</div><div className="font-display text-xl tnum mt-0.5">{t.cgpa}</div></div>
                <div><div className="font-mono text-[10px] text-ink-400">READINESS</div><div className="font-display text-xl tnum mt-0.5 text-accent">{t.readiness_score}</div></div>
                <div><div className="font-mono text-[10px] text-ink-400">ATS</div><div className="font-display text-xl tnum mt-0.5">{t.ats_score}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
