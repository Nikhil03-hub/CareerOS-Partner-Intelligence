'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

const FDP_TOPICS = [
  'AI & ML for Educators', 'Industry 4.0 Curriculum Design', 'Research Methodology',
  'Python for Data Science', 'Cloud Computing Essentials', 'Outcome-Based Education',
  'IPR & Patent Filing', 'Soft Skills & Communication', 'Accreditation Preparation (NBA/NAAC)',
]

export function ScheduleFDPButton({ collegeId }: { collegeId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', speaker: '', topic: FDP_TOPICS[0], date: '', start_time: '09:00',
    end_time: '17:00', mode: 'online', venue: '', capacity: '50',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('fdp_sessions').insert({
      college_id: collegeId, ...form, capacity: parseInt(form.capacity), registered_count: 0, status: 'scheduled',
    })
    if (error) toast.error(error.message)
    else {
      await supabase.from('activity_events').insert({
        college_id: collegeId, entity_type: 'fdp', entity_id: null,
        event_type: 'fdp.scheduled', title: `FDP scheduled: ${form.title}`, payload: {},
      })
      toast.success('FDP session scheduled')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        <Plus className="h-4 w-4" /> Schedule FDP
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border w-full max-w-lg p-6 shadow-2xl my-4">
            <h3 className="mb-4">Schedule FDP Session</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Session Title" value={form.title} onChange={v => set('title', v)} placeholder="AI & ML for Educators" required />
              <Field label="Speaker" value={form.speaker} onChange={v => set('speaker', v)} placeholder="Dr. Name" required />
              <div>
                <label className="block text-sm font-medium mb-1.5">Topic</label>
                <select value={form.topic} onChange={e => set('topic', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                  {FDP_TOPICS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" value={form.date} onChange={v => set('date', v)} type="date" required />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Mode</label>
                  <select value={form.mode} onChange={e => set('mode', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    {['online', 'offline', 'hybrid'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Start Time" value={form.start_time} onChange={v => set('start_time', v)} type="time" />
                <Field label="End Time" value={form.end_time} onChange={v => set('end_time', v)} type="time" />
                <Field label="Capacity" value={form.capacity} onChange={v => set('capacity', v)} type="number" placeholder="50" />
              </div>
              <Field label="Venue" value={form.venue} onChange={v => set('venue', v)} placeholder="Online via Zoom / Hall A" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {loading ? 'Scheduling…' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string, required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  )
}
