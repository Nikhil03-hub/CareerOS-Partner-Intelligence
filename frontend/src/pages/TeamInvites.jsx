import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { UserPlus, Trash2, Mail } from "lucide-react";
import { useAuth } from "../App";

const ROLES = ["tpo", "institution_admin", "faculty", "coordinator"];
const ROLE_COLOR = { tpo: "#ff3b00", institution_admin: "#0a0a0a", faculty: "#4a5d3a", coordinator: "#c1440e" };

export default function TeamInvites() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ email: "", name: "", role: "faculty", department: "" });
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState(null);

  const load = () => api.get("/institution/users").then(({ data }) => setItems(data.items || []));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/invite", form);
      setLast(data);
      toast.success("Invite emailed — temp password attached");
      setForm({ email: "", name: "", role: "faculty", department: "" });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invite failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this user from the institution?")) return;
    try { await api.delete(`/institution/users/${id}`); toast.success("Removed"); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || "Remove failed"); }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ TEAM · INVITES</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="invites-heading">
            Bring your team <span className="text-accent">onto the OS.</span>
          </h1>
          <p className="font-serif text-lg text-ink-500 mt-2 max-w-xl">
            Add TPOs, HODs, faculty, and coordinators. Each gets a welcome email and lands in their own workspace.
          </p>
        </div>
        <button onClick={() => setOpen(true)} data-testid="new-invite-btn" className="btn"><UserPlus size={14} /> Invite</button>
      </div>

      {open && (
        <form onSubmit={submit} className="editorial p-6 grid grid-cols-12 gap-3" data-testid="invite-form">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name"
            data-testid="invite-name" className="col-span-12 md:col-span-4 px-3 py-2.5 border border-line bg-bone-50" required />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="Institutional email"
            data-testid="invite-email" className="col-span-12 md:col-span-4 px-3 py-2.5 border border-line bg-bone-50" required />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            data-testid="invite-role" className="col-span-6 md:col-span-2 px-3 py-2.5 border border-line bg-bone-50">
            {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </select>
          <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Dept (faculty/HOD)"
            data-testid="invite-dept" className="col-span-6 md:col-span-2 px-3 py-2.5 border border-line bg-bone-50" />
          <button type="submit" data-testid="invite-submit" className="col-span-6 md:col-span-3 btn justify-center">Send invite</button>
          <button type="button" onClick={() => setOpen(false)} className="col-span-6 md:col-span-3 btn btn-ghost justify-center">Cancel</button>
          {last && (
            <div className="col-span-12 editorial bg-accent/5 border border-accent p-4 text-sm">
              <div className="font-mono text-[10px] tracking-[0.24em] text-accent">INVITE SENT</div>
              <div className="mt-1">
                <b>{last.email}</b> · temp password: <span className="font-mono">{last.temp_password}</span>
              </div>
            </div>
          )}
        </form>
      )}

      <div className="editorial" data-testid="invites-table">
        <div className="grid grid-cols-12 px-6 py-3 border-b border-line font-mono text-[10px] tracking-[0.24em] text-ink-400">
          <div className="col-span-4">NAME</div>
          <div className="col-span-3">EMAIL</div>
          <div className="col-span-2">ROLE</div>
          <div className="col-span-2">DEPT</div>
          <div className="col-span-1 text-right">ACTION</div>
        </div>
        {items.map((u) => (
          <div key={u.user_id} className="grid grid-cols-12 px-6 py-4 border-b border-line items-center text-sm" data-testid={`team-${u.user_id}`}>
            <div className="col-span-4 font-medium">{u.name}</div>
            <div className="col-span-3 text-ink-500 truncate flex items-center gap-2"><Mail size={12} /> {u.email}</div>
            <div className="col-span-2">
              <span className="pill" style={{ color: ROLE_COLOR[u.role] || "#0a0a0a", borderColor: ROLE_COLOR[u.role] || "#0a0a0a" }}>
                {u.role?.replace("_", " ")}
              </span>
            </div>
            <div className="col-span-2 text-ink-500 text-xs">{u.department || "—"}</div>
            <div className="col-span-1 text-right">
              {u.user_id !== user?.user_id && (
                <button onClick={() => remove(u.user_id)} data-testid={`remove-${u.user_id}`} className="text-ink-400 hover:text-accent">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
