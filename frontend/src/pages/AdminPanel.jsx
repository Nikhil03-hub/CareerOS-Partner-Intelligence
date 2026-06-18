import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Check, X, Bell, Building2 } from "lucide-react";

export default function AdminPanel() {
  const [pending, setPending] = useState([]);
  const [colleges, setColleges] = useState([]);

  const load = async () => {
    const [p, c] = await Promise.all([
      api.get("/admin/pending-signups"),
      api.get("/admin/colleges"),
    ]);
    setPending(p.data.items || []); setColleges(c.data.items || []);
  };
  useEffect(() => { load().catch(() => toast.error("Admin only")); }, []);

  const approve = async (id) => { await api.post(`/admin/approve/${id}`); toast.success("Approved"); load(); };
  const reject = async (id) => { await api.post(`/admin/reject/${id}`); toast.success("Rejected"); load(); };
  const testNotif = async () => { await api.post("/admin/test-notification"); toast.success("Fan-out triggered"); };

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-accent">§ INSTITUTIONS · CONTROL</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="institutions-heading">
            Approve. Manage. Override.
          </h1>
          <p className="font-serif text-lg text-ink-500 mt-2">Every partner institution and every pending signup, in one place.</p>
        </div>
        <button onClick={testNotif} data-testid="test-notif-btn" className="btn btn-ghost"><Bell size={14} /> Trigger test fan-out</button>
      </div>

      <div className="editorial" data-testid="pending-table">
        <div className="p-6 border-b border-line">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">PENDING APPROVALS · {pending.length}</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Awaiting verification</h3>
        </div>
        {pending.length === 0 ? (
          <div className="px-6 py-12 text-center text-ink-400">All caught up.</div>
        ) : pending.map((u) => (
          <div key={u.user_id} className="grid grid-cols-12 px-6 py-5 border-b border-line items-center" data-testid={`pending-${u.user_id}`}>
            <div className="col-span-4">
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-ink-500">{u.email}</div>
            </div>
            <div className="col-span-4">
              <div className="font-display text-lg">{u.institution?.name || "—"}</div>
              <div className="text-xs text-ink-400">{u.institution?.affiliated_university || ""}</div>
            </div>
            <div className="col-span-2 font-mono text-xs uppercase">{u.role}</div>
            <div className="col-span-2 flex justify-end gap-2">
              <button onClick={() => approve(u.user_id)} data-testid={`approve-${u.user_id}`} className="inline-flex items-center gap-1.5 bg-ink-900 text-bone-100 px-3 py-1.5 text-xs hover:bg-accent transition-colors">
                <Check size={12} /> Approve
              </button>
              <button onClick={() => reject(u.user_id)} data-testid={`reject-${u.user_id}`} className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs hover:border-ink-900">
                <X size={12} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="editorial" data-testid="colleges-table">
        <div className="p-6 border-b border-line">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">PARTNER INSTITUTIONS · {colleges.length}</div>
          <h3 className="font-display text-2xl tracking-tight mt-1 flex items-center gap-2"><Building2 size={20} /> The platform map</h3>
        </div>
        <div className="grid grid-cols-12 px-6 py-3 border-b border-line font-mono text-[10px] tracking-[0.24em] text-ink-400">
          <div className="col-span-4">INSTITUTION</div>
          <div className="col-span-2">STREAM</div>
          <div className="col-span-3">UNIVERSITY</div>
          <div className="col-span-2">DEPARTMENTS</div>
          <div className="col-span-1 text-right">STATUS</div>
        </div>
        {colleges.map((c) => (
          <div key={c.institution_id} className="grid grid-cols-12 px-6 py-4 border-b border-line items-center text-sm">
            <div className="col-span-4">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-ink-400">{c.city || ""} {c.state || ""}</div>
            </div>
            <div className="col-span-2"><span className="pill bg-bone-100">{c.type}</span></div>
            <div className="col-span-3 text-ink-500">{c.affiliated_university || "—"}</div>
            <div className="col-span-2 flex flex-wrap gap-1">
              {(c.departments || []).slice(0, 2).map((d) => <span key={d} className="pill bg-bone-100 text-[9px]">{d}</span>)}
            </div>
            <div className="col-span-1 text-right font-mono text-[10px]">
              {c.approved ? <span className="text-accent">● ACTIVE</span> : <span className="text-ink-400">○ PENDING</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
