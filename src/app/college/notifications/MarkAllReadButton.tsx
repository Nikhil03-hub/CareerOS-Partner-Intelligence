'use client'

import { useRouter } from 'next/navigation'
import { CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

export function MarkAllReadButton({ userId }: { userId: string }) {
  const router = useRouter()

  async function markAll() {
    try {
      const res = await fetch('/api/notifications/mark-read', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed')
      }
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <button onClick={markAll} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
      <CheckCheck className="h-4 w-4" /> Mark all read
    </button>
  )
}
