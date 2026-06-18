import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";

const STAGES = ["Applied", "Shortlisted", "Interview", "Selected", "Rejected"];
const STAGE_COLOR = { Applied: "#0a0a0a", Shortlisted: "#d4a017", Interview: "#c1440e", Selected: "#4a5d3a", Rejected: "#9a9a9a" };

export default function Applications() {
  const [d, setD] = useState(null);
  const [stage, setStage] = useState("");

  const load = (s = stage) => {
    const q = s ? `?stage=${s}` : "";
    api.get(`/applications${q}`).then(({ data }) => setD(data));
  };
  useEffect(() => { load(""); /* eslint-disable-next-line */ }, []);

  const advance = async (id, next) => {
    try { await api.patch(`/applications/${id}`, { stage: next }); toast.success(`Moved to ${next}`); load(); }
    catch { toast.error("Update failed"); }
  };

  if (!d) return <div className="font-mono text-xs text-ink-400">LOADING…</div>;

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ APPLICATION PIPELINE</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="apps-heading">
          Every candidate, <span className="text-accent">every stage.</span>
        </h1>
      </div>

      {/* Pipeline counts */}
      <div className="grid grid-cols-12 gap-3" data-testid="apps-pipeline">
        {STAGES.map((s) => (
          <button key={s} onClick={() => { setStage(s === stage ? "" : s); load(s === stage ? "" : s); }}
            className={`col-span-12 md:col-span-2 lg:col-span-2 editorial p-6 text-left transition-all ${stage === s ? "border-ink-900 border-2" : ""}`}
            data-testid={`pipeline-${s}`}>
            <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">{s.toUpperCase()}</div>
            <div className="font-display text-5xl mt-3 tnum" style={{ color: STAGE_COLOR[s] }}>{d.pipeline?.[s] || 0}</div>
          </button>
        ))}
        <button onClick={() => { setStage(""); load(""); }} className={`col-span-12 md:col-span-2 editorial p-6 text-left ${!stage ? "border-ink-900 border-2" : ""}`}>
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">ALL</div>
          <div className="font-display text-5xl mt-3 tnum">{Object.values(d.pipeline || {}).reduce((a, b) => a + b, 0)}</div>
        </button>
      </div>

      {/* Rows */}
      <div className="editorial">
        <div className="grid grid-cols-12 px-6 py-3 border-b border-line font-mono text-[10px] tracking-[0.24em] text-ink-400">
          <div className="col-span-3">STUDENT</div>
          <div className="col-span-2">ROLL</div>
          <div className="col-span-2">COMPANY</div>
          <div className="col-span-2">ROLE</div>
          <div className="col-span-1 text-right">CTC</div>
          <div className="col-span-2 text-right">STAGE</div>
        </div>
        {d.items.map((a) => (
          <div key={a.application_id} className="grid grid-cols-12 px-6 py-4 border-b border-line items-center text-sm hover:bg-bone-200 transition-colors" data-testid={`app-${a.application_id}`}>
            <div className="col-span-3">
              <div className="font-medium">{a.student_name}</div>
              <div className="font-mono text-[10px] text-ink-400">{a.department}</div>
            </div>
            <div className="col-span-2 font-mono text-xs tnum">{a.roll_number}</div>
            <div className="col-span-2 font-display tracking-tight">{a.company}</div>
            <div className="col-span-2 text-ink-500 text-xs">{a.job_title}</div>
            <div className="col-span-1 text-right font-mono text-accent tnum">₹{a.ctc_lpa?.toFixed(1)}L</div>
            <div className="col-span-2 text-right">
              <select value={a.stage} onChange={(e) => advance(a.application_id, e.target.value)} data-testid={`stage-${a.application_id}`}
                className="font-mono text-[10px] tracking-[0.16em] uppercase border border-line bg-bone-50 px-2 py-1.5"
                style={{ color: STAGE_COLOR[a.stage] }}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
