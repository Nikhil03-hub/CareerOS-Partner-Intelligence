import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../App";
import { Building2, Network, BarChart3, Users, Briefcase, Send, Award, Activity } from "lucide-react";

export default function PlatformControl() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [insts, setInsts] = useState([]);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    api.get("/admin/platform-stats").then(({ data }) => setStats(data));
    api.get("/admin/colleges").then(({ data }) => setInsts(data.items || []));
    api.get("/admin/notifications").then(({ data }) => setNotifs(data.items || []));
  }, []);

  const kpis = [
    { key: "kpi-institutions", label: "Active institutions", val: stats?.institutions ?? "—", sub: "Across 6 streams", icon: Building2 },
    { key: "kpi-pending", label: "Pending signups", val: stats?.pending_signups ?? "—", sub: "Awaiting review", icon: Activity },
    { key: "kpi-students", label: "Total students", val: stats?.students ?? "—", sub: "On platform", icon: Users },
    { key: "kpi-jobs", label: "Open drives", val: stats?.jobs_open ?? "—", sub: "Across recruiters", icon: Briefcase },
    { key: "kpi-applications", label: "Applications", val: stats?.applications ?? "—", sub: "Through pipeline", icon: Send },
    { key: "kpi-mrr", label: "Estimated MRR (₹)", val: stats?.estimated_mrr_inr?.toLocaleString?.() ?? "—", sub: "Revenue share proxy", icon: Award },
  ];

  return (
    <div className="space-y-10">
      {/* Editorial banner */}
      <div className="relative border border-line bg-ink-900 text-bone-100 p-10 lg:p-14 overflow-hidden">
        <div className="absolute right-10 top-10 opacity-20 hidden lg:block">
          <div className="font-display text-[12vw] leading-none tracking-tightest text-accent">∞</div>
        </div>
        <div className="font-mono text-[10px] tracking-[0.28em] text-bone-100/40">§ PLATFORM · COMMAND</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="platform-heading">
          Good morning, {user?.name?.split(" ")[1] || "Admin"}.
        </h1>
        <p className="font-serif text-lg text-bone-100/70 mt-3 max-w-2xl">
          The full layer. Institutions, recruiters, money, signups. You see what no one else sees.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-12 gap-3" data-testid="platform-kpis">
        {kpis.map((k, i) => (
          <div key={k.label} data-testid={k.key} className={`${i === 0 ? "col-span-12 md:col-span-6 row-span-2" : "col-span-12 md:col-span-3"} editorial p-7`}>
            <div className="flex items-center justify-between text-ink-400">
              <div className="font-mono text-[10px] tracking-[0.24em] flex items-center gap-2"><k.icon size={14} /> {k.label.toUpperCase()}</div>
            </div>
            <div className={`font-display tracking-tightest mt-5 tnum ${i === 0 ? "text-7xl md:text-8xl" : "text-4xl"}`}>{k.val}</div>
            <div className="text-sm text-ink-500 mt-2">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Institution split */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-7 editorial p-8">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">INSTITUTION MIX · BY STREAM</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Where CareerOS lives</h3>
          <div className="mt-8 space-y-4">
            {(stats?.by_type || []).map((b) => {
              const max = Math.max(...(stats.by_type.map((x) => x.count)));
              const pct = Math.round((b.count / max) * 100);
              return (
                <div key={b.type} className="flex items-center gap-4">
                  <div className="w-32 font-mono text-xs uppercase text-ink-700">{b.type}</div>
                  <div className="flex-1 h-3 bg-bone-200 relative">
                    <div className="h-full bg-ink-900" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="font-mono text-sm tnum w-8 text-right">{b.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 md:col-span-5 editorial p-8 bg-bone-50">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">RECENT INSTITUTIONS</div>
          <div className="space-y-3 mt-5">
            {insts.slice(0, 6).map((i) => (
              <div key={i.institution_id} className="border-b border-line py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{i.name}</div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">{i.type} · {i.short_name}</div>
                </div>
                <div className={`font-mono text-[10px] uppercase ${i.approved ? "text-accent" : "text-ink-400"}`}>
                  {i.approved ? "● ACTIVE" : "○ PENDING"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification fan-out */}
      <div className="editorial bg-ink-900 text-bone-100">
        <div className="p-6 border-b border-bone-100/15">
          <div className="font-mono text-[10px] tracking-[0.24em] text-bone-100/40">NOTIFICATION FAN-OUT · LIVE</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Activity feed</h3>
        </div>
        <div className="max-h-[360px] overflow-y-auto divide-y divide-bone-100/10">
          {notifs.slice(0, 18).map((n, i) => (
            <div key={i} className="grid grid-cols-12 px-6 py-3 text-sm items-center">
              <div className="col-span-2 font-mono text-[10px] tracking-[0.18em] text-bone-100/40">{n.created_at?.slice(11, 19)}</div>
              <div className="col-span-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">{n.channel}</div>
              <div className="col-span-3 text-bone-100/80">{n.event}</div>
              <div className="col-span-3 text-bone-100/60 truncate">{n.subject}</div>
              <div className="col-span-2 text-right font-mono text-[10px] uppercase">
                {n.status === "sent" ? <span className="text-accent">● {n.status}</span> : <span className="text-bone-100/40">○ {n.status}</span>}
              </div>
            </div>
          ))}
          {notifs.length === 0 && <div className="p-8 text-center text-bone-100/40 text-sm">No notifications yet.</div>}
        </div>
      </div>
    </div>
  );
}
