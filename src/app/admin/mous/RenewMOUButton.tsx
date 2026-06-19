'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw, X, Loader2 } from 'lucide-react'

interface Props {
  mouId: string
  collegeName: string
  currentExpiry: string
}

export function RenewMOUButton({ mouId, collegeName, currentExpiry }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Default new expiry = 1 year from current or today, whichever is later
  const base = new Date(Math.max(new Date(currentExpiry).getTime(), Date.now()))
  base.setFullYear(base.getFullYear() + 1)
  const defaultExpiry = base.toISOString().slice(0, 10)

  const [newExpiry, setNewExpiry] = useState(defaultExpiry)
  const [seats, setSeats] = useState('100')
  const [shareP, setShareP] = useState('10')

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/mou/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mouId, newExpiry, seats: Number(seats), shareP: Number(shareP) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success(`MOU renewed for ${collegeName} until ${new Date(newExpiry).toLocaleDateString('en-IN')}`)
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
        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1"
      >
        <RefreshCw className="h-3 w-3" /> Renew
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold">Renew MOU</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{collegeName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">New Expiry Date</label>
                <input type="date" required value={newExpiry} min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setNewExpiry(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Seats</label>
                  <input type="number" value={seats} onChange={e => setSeats(e.target.value)} min="10"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Rev Share %</label>
                  <input type="number" value={shareP} onChange={e => setShareP(e.target.value)} min="1" max="50"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-muted/50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-[2] bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Renewing…</> : <><RefreshCw className="h-4 w-4" /> Renew MOU</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
