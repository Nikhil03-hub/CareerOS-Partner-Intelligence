import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const STATUS_MAP = {
  approve: 'active',
  reject: 'rejected',
  suspend: 'suspended',
}

export async function POST(req: NextRequest) {
  const { collegeId, collegeName, action } = await req.json()
  if (!collegeId || !action || !(action in STATUS_MAP)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const newStatus = STATUS_MAP[action as keyof typeof STATUS_MAP]

  const updateData: Record<string, unknown> = { status: newStatus }
  if (action === 'approve') updateData.approved = true

  const { error } = await supabase.from('colleges').update(updateData).eq('id', collegeId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_events').insert({
    college_id: collegeId,
    entity_type: 'college',
    entity_id: collegeId,
    event_type: `college.${action}d`,
    title: `${collegeName} ${action}d`,
    payload: { previousStatus: newStatus },
  })

  if (action === 'reject' || action === 'suspend') {
    await supabase.from('notifications').insert({
      college_id: collegeId,
      type: `college.${action}d`,
      title: `College ${action}d: ${collegeName}`,
      body: `${collegeName} has been ${action}d. ${action === 'suspend' ? 'Contact admin to reactivate.' : 'Partnership application closed.'}`,
      channels: ['in_app'],
      status: 'sent',
      read: false,
    })
  }

  return NextResponse.json({ success: true, newStatus })
}
