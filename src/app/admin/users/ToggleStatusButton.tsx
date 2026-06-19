'use client'

import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ToggleStatusButton({ userId, currentStatus }: { userId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isActive = currentStatus === 'active'

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('users').update({ status: isActive ? 'deactivated' : 'active' }).eq('id', userId)
    toast.success(isActive ? 'User deactivated' : 'User activated')
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`text-xs px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-50 ${isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
      {loading ? '…' : isActive ? 'Suspend' : 'Activate'}
    </button>
  )
}
