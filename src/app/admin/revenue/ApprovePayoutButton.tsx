'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Loader2 } from 'lucide-react'

export function ApprovePayoutButton({ payoutId }: { payoutId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function approve() {
    setLoading(true)
    try {
      const res = await fetch('/api/revenue/approve-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Payout approved successfully')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={approve} disabled={loading}
      className="text-xs bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-1">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
      {loading ? '…' : 'Approve'}
    </button>
  )
}
