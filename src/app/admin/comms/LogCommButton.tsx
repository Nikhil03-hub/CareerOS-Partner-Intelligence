'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MessageSquare, X, Loader2 } from 'lucide-react'

interface College { id: string; name: string; code: string }

export function LogCommButton({ colleges }: { colleges: College[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({
    college_id: colleges[0]?.id || '',
    type: 'note',
    subject: '',
    body: '',
    created_by_name: 'Admin',
    next_meeting_at: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/comms/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Communication logged')
      setOpen(false)
      setForm(f => ({ ...f, subject: '', body: '', next_meeting_at: '' }))
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
        <MessageSquare className="h-4 w-4" /> Log Communication
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">Log Communication</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">College</label>
                <select value={form.college_id} onChange={e => set('college_id', e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {['note', 'meeting', 'call'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">By</label>
                  <input value={form.created_by_name} onChange={e => set('created_by_name', e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Admin" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Subject *</label>
                <input required value={form.subject} onChange={e => set('subject', e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="MOU renewal discussion" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea value={form.body} onChange={e => set('body', e.target.value)} rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Key points discussed…" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Next Meeting (optional)</label>
                <input type="datetime-local" value={form.next_meeting_at} onChange={e => set('next_meeting_at', e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-muted/50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-[2] bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging…</> : 'Log Communication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
