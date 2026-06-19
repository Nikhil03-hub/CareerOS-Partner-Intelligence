import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { college_id, type, subject, body: noteBody, created_by_name, next_meeting_at } = body

  if (!college_id || !subject) {
    return NextResponse.json({ error: 'college_id and subject required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const insertData: Record<string, unknown> = {
    college_id, type: type || 'note', subject,
    body: noteBody || '',
    created_by_name: created_by_name || 'Admin',
  }
  if (next_meeting_at) insertData.next_meeting_at = next_meeting_at

  const { data, error } = await supabase.from('communication_logs').insert(insertData).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_events').insert({
    college_id,
    entity_type: 'communication',
    entity_id: data.id,
    event_type: 'comm.logged',
    title: `Communication logged: ${subject}`,
    payload: { type, created_by_name },
  })

  return NextResponse.json({ success: true, id: data.id })
}
