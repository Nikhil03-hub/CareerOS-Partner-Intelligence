import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = user.user_metadata?.role
    if (role !== 'super_admin' && role !== 'account_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, newStatus } = await req.json()
    if (!userId || !newStatus) {
      return NextResponse.json({ error: 'Missing userId or newStatus' }, { status: 400 })
    }

    const admin = createServiceClient()
    const { error, count } = await admin
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)
      .select()

    if (error) throw error
    if (count === 0) return NextResponse.json({ error: 'User not found or no change made' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[toggle-status]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
