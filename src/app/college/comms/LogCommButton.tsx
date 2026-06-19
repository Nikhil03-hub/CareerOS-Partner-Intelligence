'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

export function LogCommButton({ collegeId }: { collegeId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({ type: 'note', subject: '', body: '', next_meeting_at: '' })
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('communication_logs').insert({
      college_id: collegeId, ...form,
      created_by_name: user?.user_metadata?.name || user?.email || 'Unknown',
      next_meeting_at: form.next_meeting_at || null,
    })
    if (error) toast.error(error.message)
    else { toast.success('Communication logged'); setOpen(false); router.refresh() }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        <Plus className="h-4 w-4" /> Log Communication
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl border w-full max-w-md p-6 shadow-2xl">
            <h3 className="mb-4">Log Communication</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                  {['note', 'meeting', 'call'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Subject</label>
                <input value={form.subject} onChange={e => set('subject', e.target.value)} required placeholder="Subject of discussion" className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea value={form.body} onChange={e => set('body', e.target.value)} rows={3} placeholder="Summary of discussion, action items..." className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Next Meeting (optional)</label>
                <input type="datetime-local" value={form.next_meeting_at} onChange={e => set('next_meeting_at', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{loading ? 'Saving…' : 'Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
