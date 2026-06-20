import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const { mouId, signerName, signerRole } = await req.json()
  if (!mouId || !signerName) return NextResponse.json({ error: 'mouId and signerName required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: mou, error: fetchErr } = await supabase.from('mous')
    .select('college_id, title').eq('id', mouId).single()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const signedAt = new Date().toISOString()

  const { error } = await supabase.from('mous').update({
    esign_status: 'signed',
    signed_by: signerName,
    signed_role: signerRole || 'TPO',
    signed_at: signedAt,
  }).eq('id', mouId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log the signature event
  await supabase.from('activity_events').insert({
    college_id: mou.college_id,
    entity_type: 'mou',
    entity_id: mouId,
    event_type: 'mou.signed',
    title: `MOU e-signed by ${signerName} (${signerRole || 'TPO'})`,
    payload: { signerName, signerRole, signedAt },
  })

  // Notification
  await supabase.from('notifications').insert({
    college_id: mou.college_id,
    type: 'mou.signed',
    title: 'MOU Signed Digitally',
    body: `"${mou.title}" has been e-signed by ${signerName} (${signerRole || 'TPO'}) on ${new Date(signedAt).toLocaleDateString('en-IN')}.`,
    channels: ['in_app'],
    status: 'sent',
    read: false,
  })

  revalidatePath('/college/mou')
  revalidatePath('/admin/mous')
  return NextResponse.json({ success: true, signedAt })
}
