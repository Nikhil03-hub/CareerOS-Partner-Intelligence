'use client'

import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ApprovePayoutButton({ payoutId }: { payoutId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function approve() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('payouts').update({
      status: 'paid', approved_at: new Date().toISOString()
    }).eq('id', payoutId)
    if (error) toast.error(error.message)
    else { toast.success('Payout approved'); router.refresh() }
    setLoading(false)
  }

  return (
    <button onClick={approve} disabled={loading}
      className="text-xs bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-50">
      {loading ? '…' : 'Approve'}
    </button>
  )
}
