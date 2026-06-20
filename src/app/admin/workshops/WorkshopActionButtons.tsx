'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface Props {
  requestId: string
  currentStatus: string
}

export function WorkshopActionButtons({ requestId, currentStatus }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function updateStatus(status: string) {
    setLoading(status)
    try {
      const res = await fetch('/api/workshops/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      })
      if (!res.ok) throw new Error('Failed')
      setDone(true)
      router.refresh()
    } catch {
      alert('Failed to update status')
    } finally {
      setLoading(null)
    }
  }

  if (done) return <span className="text-xs text-green-600 font-medium">✓ Updated</span>

  return (
    <div className="flex items-center gap-2 shrink-0">
      {currentStatus === 'pending' && (
        <button
          onClick={() => updateStatus('reviewing')}
          disabled={!!loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {loading === 'reviewing' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
          Review
        </button>
      )}
      <button
        onClick={() => updateStatus('approved')}
        disabled={!!loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        {loading === 'approved' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
        Approve
      </button>
      <button
        onClick={() => updateStatus('declined')}
        disabled={!!loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {loading === 'declined' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
        Decline
      </button>
    </div>
  )
}
