import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { error } = await admin
      .from('notifications')
      .update({ read: true })
      .eq('recipient_user_id', user.id)
      .eq('read', false)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[mark-read]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
