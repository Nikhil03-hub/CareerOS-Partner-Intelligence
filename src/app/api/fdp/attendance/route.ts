import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { sessionId, attended } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: session, error: fetchErr } = await supabase.from('fdp_sessions')
    .select('college_id, title, capacity').eq('id', sessionId).single()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const { error } = await supabase.from('fdp_sessions').update({
    registered_count: Number(attended),
    status: 'completed',
  }).eq('id', sessionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_events').insert({
    college_id: session.college_id,
    entity_type: 'fdp',
    entity_id: sessionId,
    event_type: 'fdp.completed',
    title: `FDP completed: ${session.title}`,
    payload: { attended, capacity: session.capacity },
  })

  return NextResponse.json({ success: true })
}
