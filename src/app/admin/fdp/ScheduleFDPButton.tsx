'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarPlus, X, Loader2 } from 'lucide-react'

interface College { id: string; name: string; code: string }

export function ScheduleFDPButton({ colleges }: { colleges: College[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({
    college_id: colleges[0]?.id || '',
    title: '',
    speaker: '',
    topic: '',
    date: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 16),
    mode: 'online',
    capacity: '50',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/fdp/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success(`FDP session "${form.title}" scheduled`)
      setOpen(false)
      setForm(f => ({ ...f, title: '', speaker: '', topic: '' }))
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
        <CalendarPlus className="h-4 w-4" /> Schedule FDP
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">Schedule FDP Session</h3>
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
              <Field label="Session Title *" value={form.title} onChange={v => set('title', v)} required placeholder="Advanced DSA Workshop" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Speaker *" value={form.speaker} onChange={v => set('speaker', v)} required placeholder="Dr. Ravi Shankar" />
                <Field label="Topic" value={form.topic} onChange={v => set('topic', v)} placeholder="Data Structures" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Date & Time *</label>
                <input type="datetime-local" required value={form.date} onChange={e => set('date', e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Mode</label>
                  <select value={form.mode} onChange={e => set('mode', e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {['online', 'offline', 'hybrid'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <Field label="Capacity" value={form.capacity} onChange={v => set('capacity', v)} type="number" placeholder="50" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-muted/50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-[2] bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling…</> : <><CalendarPlus className="h-4 w-4" /> Schedule</>}
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
