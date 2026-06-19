'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ApproveCollegeButton({ collegeId, collegeName }: { collegeId: string; collegeName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function approve() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('colleges')
      .update({ status: 'approved', approved: true })
      .eq('id', collegeId)

    if (error) {
      toast.error('Failed to approve college')
    } else {
      // Log event
      await supabase.from('activity_events').insert({
        college_id: collegeId,
        entity_type: 'college',
        entity_id: collegeId,
        event_type: 'college.approved',
        title: `${collegeName} approved as partner`,
        payload: {},
      })
      toast.success(`${collegeName} approved!`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={approve}
      disabled={loading}
      className="text-xs bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-50"
    >
      {loading ? '…' : 'Approve'}
    </button>
  )
}
