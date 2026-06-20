import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = user.user_metadata?.role
    if (!['super_admin', 'account_manager'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { requestId, status } = await req.json()
    if (!requestId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const validStatuses = ['reviewing', 'approved', 'declined', 'scheduled']
    if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

    const supabase = createServiceClient()
    const { error } = await supabase.from('workshop_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) throw error

    // Log activity
    await supabase.from('activity_events').insert({
      event_type: `workshop.${status}`,
      entity_type: 'workshop_request',
      entity_id: requestId,
      payload: { status, updated_by: user.id },
    }).single()

    revalidatePath('/admin/workshops')
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
