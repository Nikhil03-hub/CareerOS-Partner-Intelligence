import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { college_id, title, speaker, topic, date, mode, capacity } = await req.json()
  if (!college_id || !title || !speaker || !date) {
    return NextResponse.json({ error: 'college_id, title, speaker, date required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase.from('fdp_sessions').insert({
    college_id,
    title,
    speaker,
    topic: topic || title,
    date,
    mode: mode || 'online',
    capacity: Number(capacity) || 50,
    registered_count: 0,
    status: 'scheduled',
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_events').insert({
    college_id,
    entity_type: 'fdp',
    entity_id: data.id,
    event_type: 'fdp.scheduled',
    title: `FDP scheduled: ${title}`,
    payload: { speaker, date, mode },
  })

  return NextResponse.json({ success: true, id: data.id })
}
