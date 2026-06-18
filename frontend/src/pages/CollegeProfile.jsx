import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../App";
import { toast } from "sonner";
import { Save, Edit3 } from "lucide-react";

export default function CollegeProfile() {
  const { user } = useAuth();
  const [inst, setInst] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const iid = user?.institution_id || "inst_kmit";

  useEffect(() => {
    api.get(`/institutions/${iid}`).then(({ data }) => { setInst(data); setForm(data); });
  }, [iid]);

  const save = async () => {
    try {
      await api.patch(`/institutions/${iid}`, form);
      setInst(form); setEdit(false); toast.success("Profile updated");
    } catch { toast.error("Update failed"); }
  };
  if (!inst) return <div className="font-mono text-xs text-ink-400">LOADING…</div>;

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ INSTITUTION PROFILE</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="profile-heading">{inst.name}</h1>
          <p className="font-serif text-lg text-ink-500 mt-2">{inst.tagline || "Institutional identity, affiliations, partnership configuration."}</p>
        </div>
        {!edit ? (
          <button onClick={() => setEdit(true)} data-testid="edit-college-btn" className="btn btn-ghost"><Edit3 size={14} /> Edit profile</button>
        ) : (
          <button onClick={save} data-testid="save-college-btn" className="btn"><Save size={14} /> Save</button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-8 editorial p-10">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { k: "name", label: "Institution" },
              { k: "short_name", label: "Short name" },
              { k: "city", label: "City" },
              { k: "state", label: "State" },
              { k: "affiliated_university", label: "Affiliated university" },
              { k: "type", label: "Stream" },
            ].map((f) => (
              <div key={f.k} data-testid={`profile-${f.k}`}>
                <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">{f.label.toUpperCase()}</div>
                {edit ? (
                  <input value={form[f.k] || ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                    className="mt-2 w-full px-3 py-2 border border-line bg-bone-100 focus:outline-none focus:border-ink-900" />
                ) : (
                  <div className="font-display text-2xl mt-2 tracking-tight">{inst[f.k] || "—"}</div>
                )}
              </div>
            ))}
            <div className="md:col-span-2">
              <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">DEPARTMENTS</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(inst.departments || []).map((d) => <span key={d} className="pill bg-bone-100">{d}</span>)}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">PARTNERSHIP</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(inst.partnership_types || []).map((p) => <span key={p} className="pill pill-solid">{p}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 space-y-3">
          <div className="editorial bg-ink-900 text-bone-100 p-8">
            <div className="font-mono text-[10px] tracking-[0.24em] text-bone-100/40">PARTNERSHIP STATUS</div>
            <div className="font-display text-4xl mt-3">{inst.approved ? "Active" : "Pending"}</div>
            <div className="text-bone-100/60 text-sm mt-2">Onboarded · {inst.created_at?.slice(0, 10)}</div>
          </div>
          <div className="editorial p-8 bg-bone-50">
            <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">ESTABLISHED</div>
            <div className="font-display text-5xl mt-3 tnum">{inst.established || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
