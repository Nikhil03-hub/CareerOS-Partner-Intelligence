import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Search, Filter, Plus } from "lucide-react";
import { toast } from "sonner";

export default function StudentRoster() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [placed, setPlaced] = useState("");
  const [adding, setAdding] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", roll_number: "", department: "CSE", email: "", phone: "", cgpa: 7.5 });

  const load = async () => {
    const params = {};
    if (q) params.q = q;
    if (dept) params.department = dept;
    if (placed) params.placed = placed === "yes";
    const { data } = await api.get("/students", { params });
    setItems(data.items);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [dept, placed]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/students", newStudent);
      toast.success("Student added");
      setAdding(false);
      setNewStudent({ name: "", roll_number: "", department: "CSE", email: "", phone: "", cgpa: 7.5 });
      load();
    } catch {
      toast.error("Could not add student");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="num-mono text-[11px] tracking-[0.28em] text-ink-400">FEATURE · 03</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3">Student roster</h1>
          <p className="font-serif text-lg text-ink-500 mt-2">Every enrolled student, every batch. Filter, sort, and act.</p>
        </div>
        <button onClick={() => setAdding(true)} data-testid="add-student-btn" className="inline-flex items-center gap-2 bg-accent text-bone-100 px-5 py-3 text-sm hover:bg-accent transition-colors">
          <Plus size={14} /> Add student
        </button>
      </div>

      {/* Filter bar */}
      <div className="border border-line bg-bone-50 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] border border-line px-3 bg-bone-100">
          <Search size={14} className="text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search name or roll number…"
            data-testid="roster-search"
            className="bg-transparent w-full py-2 text-sm focus:outline-none"
          />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} data-testid="roster-dept-filter" className="border border-line bg-bone-100 px-3 py-2 text-sm">
          <option value="">All departments</option>
          {["CSE", "IT", "CSE-AIML", "CSE-DS"].map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={placed} onChange={(e) => setPlaced(e.target.value)} data-testid="roster-placed-filter" className="border border-line bg-bone-100 px-3 py-2 text-sm">
          <option value="">All status</option>
          <option value="yes">Placed</option>
          <option value="no">Unplaced</option>
        </select>
        <button onClick={load} data-testid="roster-apply-btn" className="inline-flex items-center gap-2 bg-accent text-bone-100 px-4 py-2 text-sm hover:bg-accent transition-colors">
          <Filter size={14} /> Apply
        </button>
        <span className="num-mono text-[11px] text-ink-400 tracking-[0.18em] ml-auto" data-testid="roster-count">{items.length} STUDENTS</span>
      </div>

      {adding && (
        <form onSubmit={submit} className="border border-line bg-bone-50 p-6 grid md:grid-cols-3 gap-3" data-testid="add-student-form">
          {[
            { k: "name", label: "Name" },
            { k: "roll_number", label: "Roll number" },
            { k: "email", label: "Email" },
            { k: "phone", label: "Phone" },
          ].map((f) => (
            <input key={f.k} required={f.k === "name"} placeholder={f.label} value={newStudent[f.k]}
              onChange={(e) => setNewStudent({ ...newStudent, [f.k]: e.target.value })}
              data-testid={`new-${f.k}`}
              className="px-3 py-2 border border-line bg-bone-100 text-sm focus:outline-none focus:border-ink-900"
            />
          ))}
          <select value={newStudent.department} onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })} data-testid="new-department" className="px-3 py-2 border border-line bg-bone-100 text-sm">
            {["CSE", "IT", "CSE-AIML", "CSE-DS"].map((d) => <option key={d}>{d}</option>)}
          </select>
          <input type="number" step="0.01" placeholder="CGPA" value={newStudent.cgpa} onChange={(e) => setNewStudent({ ...newStudent, cgpa: parseFloat(e.target.value) })} className="px-3 py-2 border border-line bg-bone-100 text-sm" />
          <div className="md:col-span-3 flex gap-3">
            <button type="submit" data-testid="save-student-btn" className="bg-accent text-bone-100 px-5 py-2 text-sm hover:bg-accent">Save</button>
            <button type="button" onClick={() => setAdding(false)} className="border border-line px-5 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="border border-line bg-bone-50 overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-4 border-b border-line num-mono text-[10px] tracking-[0.24em] text-ink-400">
          <div className="col-span-3">STUDENT</div>
          <div className="col-span-2">ROLL</div>
          <div className="col-span-2">DEPT</div>
          <div className="col-span-1 text-center">CGPA</div>
          <div className="col-span-2">PLACEMENT</div>
          <div className="col-span-2 text-right">CTC</div>
        </div>
        {items.map((s, i) => (
          <div key={s.student_id} className="grid grid-cols-12 px-6 py-4 border-b border-line items-center hover:bg-bone-100 transition-colors" data-testid={`student-row-${i}`}>
            <div className="col-span-3">
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-ink-400">{s.email}</div>
            </div>
            <div className="col-span-2 num-mono text-sm">{s.roll_number}</div>
            <div className="col-span-2"><span className="pill bg-bone-100">{s.department}</span></div>
            <div className="col-span-1 text-center num-mono">{s.cgpa}</div>
            <div className="col-span-2">
              {s.placement?.placed ? (
                <span className="num-mono text-xs text-accent">● {s.placement.company}</span>
              ) : (
                <span className="num-mono text-xs text-ink-400">○ Open</span>
              )}
            </div>
            <div className="col-span-2 text-right num-mono">{s.placement?.placed ? `₹${s.placement.ctc_lpa?.toFixed(1)}L` : "—"}</div>
          </div>
        ))}
        {items.length === 0 && <div className="px-6 py-16 text-center text-ink-400">No students match these filters.</div>}
      </div>
    </div>
  );
}
