'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

// Note: invite goes through /api/users/invite which uses service role key

const ROLES = ['tpo', 'hod', 'faculty_coord', 'club_coord', 'account_manager']

export function InviteUserButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', role: 'tpo', college_id: '' })
  const [colleges, setColleges] = useState<{ id: string; name: string; code: string }[]>([])

  async function loadColleges() {
    const supabase = createClient()
    const { data } = await supabase.from('colleges').select('id, name, code').eq('status', 'approved')
    setColleges(data || [])
  }

  function open_() { setOpen(true); loadColleges() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email,
          role: form.role, college_id: form.college_id || null,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to invite user')
      toast.success(`Invite sent to ${form.email}`)
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={open_} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        <UserPlus className="h-4 w-4" /> Invite User
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl border w-full max-w-md p-6 shadow-2xl">
            <h3 className="mb-4">Invite User</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: 'Full Name', key: 'name', placeholder: 'Dr. Ravi Kumar' },
                { label: 'Email', key: 'email', placeholder: 'user@college.edu', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} placeholder={f.placeholder} required
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <select value={form.role} onChange={e => setForm(x => ({ ...x, role: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              {form.role !== 'account_manager' && colleges.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">College</label>
                  <select value={form.college_id} onChange={e => setForm(x => ({ ...x, college_id: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select college</option>
                    {colleges.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-accent">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{loading ? 'Inviting…' : 'Send Invite'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
