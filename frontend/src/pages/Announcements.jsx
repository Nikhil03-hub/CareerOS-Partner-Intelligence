import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Megaphone, Plus, Pin } from "lucide-react";
import { useAuth } from "../App";

const KINDS = ["drive", "training", "report", "fdp", "general"];
const KIND_COLOR = { drive: "#ff3b00", training: "#0a0a0a", report: "#c1440e", fdp: "#4a5d3a", general: "#9a9a9a" };

export default function Announcements() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", kind: "general", pinned: false });
  const [adding, setAdding] = useState(false);

  const load = () => api.get("/announcements").then(({ data }) => setItems(data.items || []));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/announcements", form);
      toast.success("Broadcast sent — fan-out triggered");
      setForm({ title: "", body: "", kind: "general", pinned: false });
      setAdding(false);
      load();
    } catch { toast.error("Failed"); }
  };

  const canPost = ["tpo", "institution_admin", "faculty", "super_admin"].includes(user?.role);

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ BROADCASTS</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="ann-heading">
            What the campus <span className="text-accent">needs to know.</span>
          </h1>
        </div>
        {canPost && (
          <button onClick={() => setAdding(true)} data-testid="new-ann-btn" className="btn">
            <Plus size={14} /> New broadcast
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={submit} className="editorial p-6 grid grid-cols-12 gap-3" data-testid="ann-form">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title"
            data-testid="ann-title" className="col-span-12 md:col-span-6 px-4 py-3 border border-line bg-bone-50 focus:outline-none focus:border-ink-900" required />
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} data-testid="ann-kind"
            className="col-span-6 md:col-span-3 px-4 py-3 border border-line bg-bone-50">
            {KINDS.map((k) => <option key={k} value={k}>{k.toUpperCase()}</option>)}
          </select>
          <label className="col-span-6 md:col-span-3 flex items-center gap-2 px-4 py-3 border border-line bg-bone-50 text-sm">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
            Pin to top
          </label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Message"
            data-testid="ann-body" rows={4} className="col-span-12 px-4 py-3 border border-line bg-bone-50 focus:outline-none focus:border-ink-900 font-serif" required />
          <button type="submit" data-testid="ann-submit" className="col-span-6 md:col-span-3 btn justify-center">Broadcast</button>
          <button type="button" onClick={() => setAdding(false)} className="col-span-6 md:col-span-3 btn btn-ghost justify-center">Cancel</button>
        </form>
      )}

      <div className="space-y-3" data-testid="ann-list">
        {items.map((a) => (
          <div key={a.announcement_id} className="editorial p-7 grid grid-cols-12 gap-6 items-start" data-testid={`ann-${a.announcement_id}`}>
            <div className="col-span-12 md:col-span-2">
              <div className="font-mono text-[10px] tracking-[0.24em] uppercase" style={{ color: KIND_COLOR[a.kind] || "#9a9a9a" }}>§ {a.kind}</div>
              <div className="font-mono text-[10px] text-ink-400 mt-2">{a.created_at?.slice(0, 10)}</div>
              {a.pinned && <div className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-accent"><Pin size={10} /> PINNED</div>}
            </div>
            <div className="col-span-12 md:col-span-10">
              <h3 className="font-display text-2xl tracking-tight">{a.title}</h3>
              <p className="font-serif text-base text-ink-700 mt-2">{a.body}</p>
              <div className="font-mono text-[10px] text-ink-400 tracking-[0.2em] mt-3 uppercase">by {a.by_role}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="editorial p-12 text-center text-ink-400">No broadcasts yet.</div>}
      </div>
    </div>
  );
}
