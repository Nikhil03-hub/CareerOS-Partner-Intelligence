'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus, X, Loader2 } from 'lucide-react'

interface College { id: string; name: string; code: string }

export function AddStudentButton({ colleges }: { colleges: College[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', roll_no: '',
    college_id: colleges[0]?.id || '',
    cgpa: '7.5', batch_year: '2023',
    placement_status: 'unplaced', gender: 'Male',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/students/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success(`${form.name} added successfully`)
      setOpen(false)
      setForm(f => ({ ...f, name: '', email: '', phone: '', roll_no: '' }))
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <UserPlus className="h-4 w-4" /> Add Student
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">Add Student</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Full Name" value={form.name} onChange={v => set('name', v)} required placeholder="Ravi Kumar" />
              <Field label="Email" value={form.email} onChange={v => set('email', v)} required type="email" placeholder="ravi@kmit.edu" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 98765 43210" />
                <Field label="Roll No" value={form.roll_no} onChange={v => set('roll_no', v)} placeholder="23CSE001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">College</label>
                <select value={form.college_id} onChange={e => set('college_id', e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="CGPA" value={form.cgpa} onChange={v => set('cgpa', v)} type="number" placeholder="7.5" />
                <Field label="Batch Year" value={form.batch_year} onChange={v => set('batch_year', v)} type="number" placeholder="2023" />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Gender</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Placement Status</label>
                <select value={form.placement_status} onChange={e => set('placement_status', e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {['unplaced', 'in_process', 'placed'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-muted/50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, value, onChange, required, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  required?: boolean; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  )
}
