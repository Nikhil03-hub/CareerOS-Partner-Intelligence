import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { mouId, newExpiry, seats, shareP } = await req.json()
  if (!mouId || !newExpiry) return NextResponse.json({ error: 'mouId and newExpiry required' }, { status: 400 })

  const supabase = createServiceClient()

  // Fetch current MOU
  const { data: mou, error: fetchErr } = await supabase.from('mous')
    .select('college_id, title').eq('id', mouId).single()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const updates: Record<string, unknown> = {
    expiry_date: newExpiry,
    status: 'active',
  }
  if (seats) updates.seats_purchased = Number(seats)
  if (shareP) updates.revenue_share_pct = Number(shareP)

  const { error } = await supabase.from('mous').update(updates).eq('id', mouId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_events').insert({
    college_id: mou.college_id,
    entity_type: 'mou',
    entity_id: mouId,
    event_type: 'mou.renewed',
    title: `MOU renewed: ${mou.title}`,
    payload: { newExpiry, seats, shareP },
  })

  await supabase.from('notifications').insert({
    college_id: mou.college_id,
    type: 'mou.renewed',
    title: 'MOU Renewed Successfully',
    body: `MOU "${mou.title}" has been renewed. New expiry: ${new Date(newExpiry).toLocaleDateString('en-IN')}.`,
    channels: ['in_app'],
    status: 'sent',
    read: false,
  })

  return NextResponse.json({ success: true })
}
