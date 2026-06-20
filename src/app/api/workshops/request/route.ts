import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const { collegeId, kind, topic, preferredDate, notes } = await req.json()
  if (!collegeId || !kind || !topic) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = createServiceClient()

  const { error } = await supabase.from('workshop_requests').insert({
    college_id: collegeId,
    kind,
    topic,
    preferred_date: preferredDate || null,
    notes: notes || null,
    status: 'requested',
  })

  if (error) {
    // If table doesn't exist yet, return graceful error
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'Workshop requests table not set up yet. Run the migration.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify account manager via activity_events
  await supabase.from('activity_events').insert({
    college_id: collegeId,
    entity_type: 'college',
    entity_id: collegeId,
    event_type: 'workshop.requested',
    title: `Workshop request: ${topic}`,
    payload: { kind, topic, preferredDate, notes },
  }).then(() => {}) // non-blocking

  revalidatePath('/college/workshops')
  return NextResponse.json({ success: true })
}
