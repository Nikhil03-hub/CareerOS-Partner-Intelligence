'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCheck } from 'lucide-react'

export function MarkAllReadButton({ userId }: { userId: string }) {
  const router = useRouter()

  async function markAll() {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true })
      .eq('recipient_user_id', userId).eq('read', false)
    router.refresh()
  }

  return (
    <button onClick={markAll} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
      <CheckCheck className="h-4 w-4" /> Mark all read
    </button>
  )
}
