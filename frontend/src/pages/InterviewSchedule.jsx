import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { CalendarPlus, Clock, MapPin, X } from "lucide-react";
import { useAuth } from "../App";

const TYPES = ["Technical", "HR", "System Design", "Behavioral", "Final"];
const TYPE_COLOR = { Technical: "#0a0a0a", HR: "#4a5d3a", "System Design": "#c1440e", Behavioral: "#d4a017", Final: "#ff3b00" };

export default function InterviewSchedule() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    student_id: "", company: "", role: "", type: "Technical",
    starts_at: "", duration_min: 45, location: "Online · Zoom", notes: "",
  });
  const [open, setOpen] = useState(false);

  const load = () => api.get("/interviews/schedule").then(({ data }) => setItems(data.items || []));
  useEffect(() => {
    load();
    if (user?.role !== "student") {
      api.get("/students").then(({ data }) => setStudents(data.items || []));
      api.get("/jobs").then(({ data }) => setJobs(data.items || []));
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.starts_at) { toast.error("Pick student and time"); return; }
    try {
      const payload = { ...form, starts_at: new Date(form.starts_at).toISOString() };
      await api.post("/interviews/schedule", payload);
      toast.success("Interview scheduled · invite emailed with .ics");
      setOpen(false);
      setForm({ student_id: "", company: "", role: "", type: "Technical", starts_at: "", duration_min: 45, location: "Online · Zoom", notes: "" });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Schedule failed");
    }
  };

  const cancel = async (id) => {
    try { await api.delete(`/interviews/schedule/${id}`); toast.success("Cancelled"); load(); }
    catch { toast.error("Cancel failed"); }
  };

  const canSchedule = user?.role !== "student";

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ INTERVIEW · SCHEDULER</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="sched-heading">
            Every slot <span className="text-accent">on the calendar.</span>
          </h1>
          <p className="font-serif text-lg text-ink-500 mt-2 max-w-xl">
            In-app scheduling with .ics calendar invites + email + telegram nudge. The pipeline auto-advances to "Interview".
          </p>
        </div>
        {canSchedule && (
          <button onClick={() => setOpen(true)} data-testid="new-interview-btn" className="btn">
            <CalendarPlus size={14} /> Schedule new
          </button>
        )}
      </div>

      {open && canSchedule && (
        <form onSubmit={submit} className="editorial p-6 grid grid-cols-12 gap-3" data-testid="sched-form">
          <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            data-testid="sched-student" className="col-span-12 md:col-span-4 px-3 py-2.5 border border-line bg-bone-50" required>
            <option value="">Pick student…</option>
            {students.slice(0, 200).map((s) => <option key={s.student_id} value={s.student_id}>{s.name} · {s.roll_number} ({s.department})</option>)}
          </select>
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
            data-testid="sched-company" placeholder="Company" className="col-span-12 md:col-span-3 px-3 py-2.5 border border-line bg-bone-50" required />
          <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            data-testid="sched-role" placeholder="Role · SDE / Analyst" className="col-span-12 md:col-span-3 px-3 py-2.5 border border-line bg-bone-50" required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            data-testid="sched-type" className="col-span-12 md:col-span-2 px-3 py-2.5 border border-line bg-bone-50">
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} type="datetime-local"
            data-testid="sched-when" className="col-span-12 md:col-span-4 px-3 py-2.5 border border-line bg-bone-50" required />
          <input value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value || "45") })} type="number"
            data-testid="sched-duration" placeholder="Duration (min)" className="col-span-12 md:col-span-2 px-3 py-2.5 border border-line bg-bone-50" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            data-testid="sched-location" placeholder="Zoom / In-person" className="col-span-12 md:col-span-3 px-3 py-2.5 border border-line bg-bone-50" />
          <select value={form.job_id || ""} onChange={(e) => setForm({ ...form, job_id: e.target.value || undefined })}
            className="col-span-12 md:col-span-3 px-3 py-2.5 border border-line bg-bone-50">
            <option value="">(optional) link to job…</option>
            {jobs.map((j) => <option key={j.job_id} value={j.job_id}>{j.company} · {j.title}</option>)}
          </select>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes (panel, link, prep)" data-testid="sched-notes" className="col-span-12 px-3 py-2.5 border border-line bg-bone-50" />
          <button type="submit" data-testid="sched-submit" className="col-span-6 md:col-span-3 btn justify-center">Schedule + invite</button>
          <button type="button" onClick={() => setOpen(false)} className="col-span-6 md:col-span-3 btn btn-ghost justify-center">Cancel</button>
        </form>
      )}

      {/* Timeline */}
      <div className="editorial" data-testid="sched-list">
        <div className="p-6 border-b border-line">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">UPCOMING · {items.filter((i) => i.status !== "cancelled").length}</div>
          <h3 className="font-display text-2xl tracking-tight mt-1">Schedule</h3>
        </div>
        {items.length === 0 && <div className="px-6 py-12 text-center text-ink-400">No interviews scheduled yet.</div>}
        {items.map((it) => (
          <div key={it.interview_id} className="grid grid-cols-12 px-6 py-5 border-b border-line items-center" data-testid={`sched-${it.interview_id}`}>
            <div className="col-span-12 md:col-span-2 font-mono text-xs">
              <div className="text-ink-400 tracking-[0.18em]">{new Date(it.starts_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase()}</div>
              <div className="font-display text-2xl text-ink-900 tnum">{new Date(it.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="font-medium">{it.student_name}</div>
              <div className="text-xs text-ink-400 font-mono">{it.roll_number} · {it.department}</div>
            </div>
            <div className="col-span-12 md:col-span-2">
              <div className="font-display text-lg tracking-tight">{it.company}</div>
              <div className="text-xs text-ink-500">{it.role}</div>
            </div>
            <div className="col-span-6 md:col-span-2">
              <span className="pill" style={{ color: TYPE_COLOR[it.type], borderColor: TYPE_COLOR[it.type] }}>{it.type}</span>
              <div className="text-xs text-ink-500 mt-1 flex items-center gap-1"><MapPin size={10} /> {it.location}</div>
            </div>
            <div className="col-span-6 md:col-span-1 text-right font-mono text-xs">
              <Clock size={12} className="inline" /> {it.duration_min}m
            </div>
            <div className="col-span-12 md:col-span-1 text-right">
              {it.status === "cancelled" ? (
                <span className="font-mono text-[10px] text-ink-400">CANCELLED</span>
              ) : canSchedule ? (
                <button onClick={() => cancel(it.interview_id)} data-testid={`cancel-${it.interview_id}`} className="text-ink-400 hover:text-accent transition-colors">
                  <X size={14} />
                </button>
              ) : <span className="font-mono text-[10px] text-accent">● SCHEDULED</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
