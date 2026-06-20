'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

// Creates a REAL auth login via /api/users/invite (service role). Password defaults to careeros2026.
const ROLES = [
  { value: 'tpo', label: 'TPO (College)', needsCollege: true },
  { value: 'hod', label: 'HOD (Department)', needsCollege: true },
  { value: 'faculty_coord', label: 'Faculty Coordinator', needsCollege: true },
  { value: 'club_coord', label: 'Club Coordinator', needsCollege: true },
  { value: 'account_manager', label: 'Account Manager (Skill Tank)', needsCollege: false },
]

export function InviteUserButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', role: 'tpo', college_id: '', password: 'careeros2026' })
  const [colleges, setColleges] = useState<{ id: string; name: string; code: string }[]>([])

  const needsCollege = ROLES.find(r => r.value === form.role)?.needsCollege ?? false

  async function loadColleges() {
    try {
      const res = await fetch('/api/colleges/list')
      const json = await res.json()
      setColleges(json.colleges || [])
    } catch { /* non-fatal */ }
  }

  function openModal() { setOpen(true); loadColleges() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (needsCollege && !form.college_id) {
      toast.error('Please select a college — this role needs one to access its portal.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, role: form.role,
          college_id: needsCollege ? form.college_id : null,
          password: form.password || 'careeros2026',
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to create user')
      toast.success(`User created. They can sign in now → ${form.email} / ${form.password || 'careeros2026'}`, { duration: 12000 })
      setForm({ name: '', email: '', role: 'tpo', college_id: '', password: 'careeros2026' })
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={openModal} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        <UserPlus className="h-4 w-4" /> Add User
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl border w-full max-w-md p-6 shadow-2xl">
            <h3 className="mb-1 font-semibold">Add User</h3>
            <p className="text-xs text-muted-foreground mb-4">Creates a real sign-in. The user lands on their role&rsquo;s portal automatically.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: 'Full Name', key: 'name', placeholder: 'Dr. Ravi Kumar', type: 'text' },
                { label: 'Email', key: 'email', placeholder: 'user@college.edu', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} placeholder={f.placeholder} required
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <select value={form.role} onChange={e => setForm(x => ({ ...x, role: e.target.value, college_id: '' }))} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {needsCollege && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">College <span className="text-red-500">*</span></label>
                  <select value={form.college_id} onChange={e => setForm(x => ({ ...x, college_id: e.target.value }))} required
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">{colleges.length ? 'Select college' : 'Loading colleges…'}</option>
                    {colleges.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Temp Password</label>
                <input type="text" value={form.password} onChange={e => setForm(x => ({ ...x, password: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                <p className="text-[11px] text-muted-foreground mt-1">Share this with the user. They sign in with their email + this password.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-accent">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{loading ? 'Creating…' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
