'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'

export function WorkshopRequestForm({ collegeId, topics }: { collegeId: string; topics: string[] }) {
  const [loading, setLoading] = useState(false)
  const [kind, setKind] = useState('workshop')
  const [topic, setTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [notes, setNotes] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalTopic = topic === '__custom__' ? customTopic : topic
    if (!finalTopic.trim()) return toast.error('Please select or enter a topic')
    setLoading(true)
    try {
      const res = await fetch('/api/workshops/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId, kind, topic: finalTopic, preferredDate: preferredDate || null, notes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to submit request')
      toast.success('Workshop request submitted! Your account manager will be in touch.')
      setKind('workshop'); setTopic(''); setCustomTopic(''); setPreferredDate(''); setNotes('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold mb-4">New Request</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Type</label>
          <div className="flex gap-3">
            {['workshop', 'hackathon', 'seminar'].map(t => (
              <button key={t} type="button"
                onClick={() => setKind(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  kind === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'
                }`}>
                {t === 'workshop' ? '🎓' : t === 'hackathon' ? '⚡' : '🎤'} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Topic</label>
          <select value={topic} onChange={e => setTopic(e.target.value)} required
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select a topic...</option>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="__custom__">Other (specify below)</option>
          </select>
        </div>

        {topic === '__custom__' && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Custom Topic</label>
            <input type="text" value={customTopic} onChange={e => setCustomTopic(e.target.value)}
              placeholder="Describe the topic you need..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">Preferred Date <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Student count, specific requirements, department, etc."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4" /> Submit Request</>}
        </button>
      </form>
    </div>
  )
}
