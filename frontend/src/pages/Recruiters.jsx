import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Recruiters() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/recruiters").then(({ data }) => setItems(data.items || [])); }, []);

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ RECRUITER NETWORK</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="rec-heading">
          {items.length} active <span className="text-accent">partners.</span>
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-3" data-testid="rec-grid">
        {items.map((r, i) => (
          <div key={r.recruiter_id} className="col-span-12 md:col-span-6 lg:col-span-4 editorial p-7 group hover:border-ink-900 transition-colors" data-testid={`rec-${i}`}>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 grid place-items-center font-display text-2xl text-bone-100" style={{ background: r.logo_color }}>
                {r.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-2xl tracking-tight">{r.name}</div>
                <div className="font-mono text-[10px] tracking-[0.18em] text-ink-400 uppercase">{r.industry}</div>
              </div>
            </div>
            <div className="hairline my-5" />
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="font-mono text-[10px] text-ink-400 tracking-[0.18em]">HIRES</div>
                <div className="font-display text-2xl tnum mt-0.5">{r.hires_total}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-ink-400 tracking-[0.18em]">DRIVES</div>
                <div className="font-display text-2xl tnum mt-0.5">{r.drives_count}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-ink-400 tracking-[0.18em]">AVG CTC</div>
                <div className="font-display text-2xl tnum mt-0.5 text-accent">₹{r.avg_ctc_offered}L</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
