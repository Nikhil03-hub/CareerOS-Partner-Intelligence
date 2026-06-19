'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users, X, Loader2 } from 'lucide-react'

interface Props {
  sessionId: string
  sessionTitle: string
  capacity: number
}

export function MarkAttendanceButton({ sessionId, sessionTitle, capacity }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attended, setAttended] = useState(String(Math.round(capacity * 0.75)))
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/fdp/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, attended: Number(attended) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success(`Attendance marked: ${attended}/${capacity} attended`)
      setOpen(false)
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
        className="text-xs bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1"
      >
        <Users className="h-3 w-3" /> Attendance
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Mark Attendance</h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px] truncate">{sessionTitle}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Attendees (out of {capacity})</label>
                <input type="number" required value={attended} min="0" max={capacity}
                  onChange={e => setAttended(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <p className="text-xs text-muted-foreground mt-1">
                  Attendance rate: {Math.round(Number(attended) / capacity * 100)}%
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-muted/50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-[2] bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Users className="h-4 w-4" /> Confirm</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
