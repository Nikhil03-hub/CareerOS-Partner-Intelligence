'use client'

import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ToggleStatusButton({ userId, currentStatus }: { userId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isActive = currentStatus === 'active'

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/users/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newStatus: isActive ? 'deactivated' : 'active' }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed')
      toast.success(isActive ? 'User deactivated' : 'User activated')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`text-xs px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-50 ${isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
      {loading ? '...' : isActive ? 'Suspend' : 'Activate'}
    </button>
  )
}
