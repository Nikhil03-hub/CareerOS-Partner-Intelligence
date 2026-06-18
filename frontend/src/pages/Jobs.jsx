import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Briefcase, Calendar, MapPin } from "lucide-react";

export default function Jobs() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/jobs?status=open").then(({ data }) => setItems(data.items || [])); }, []);

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ ACTIVE DRIVES</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="jobs-heading">
          {items.length} open <span className="text-accent">opportunities.</span>
        </h1>
        <p className="font-serif text-lg text-ink-500 mt-2 max-w-xl">Recruiter drives currently accepting applications.</p>
      </div>

      <div className="grid grid-cols-12 gap-3" data-testid="jobs-grid">
        {items.map((j, i) => (
          <div key={j.job_id} className="col-span-12 md:col-span-6 lg:col-span-4 editorial p-7 group hover:border-ink-900 transition-colors" data-testid={`job-${i}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">{j.status?.toUpperCase()} · {j.location}</div>
                <div className="font-display text-2xl mt-1 tracking-tight group-hover:text-accent transition-colors">{j.company}</div>
                <div className="text-sm text-ink-700 mt-1">{j.title}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">CTC</div>
                <div className="font-display text-2xl tnum text-accent">₹{j.ctc_lpa}L</div>
              </div>
            </div>
            <div className="hairline my-5" />
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="font-mono text-[10px] text-ink-400 tracking-[0.18em]">OPENINGS</div>
                <div className="font-display text-xl tnum mt-0.5">{j.openings}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-ink-400 tracking-[0.18em]">APPLIED</div>
                <div className="font-display text-xl tnum mt-0.5">{j.applied_count}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-ink-400 tracking-[0.18em]">MIN CGPA</div>
                <div className="font-display text-xl tnum mt-0.5">{j.eligibility_cgpa}</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-4 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5"><Calendar size={12} /> {j.drive_date?.slice(0, 10)}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> {j.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
