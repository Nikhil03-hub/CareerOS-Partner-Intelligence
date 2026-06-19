import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Verify caller is super_admin or account_manager
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = user.user_metadata?.role
    if (role !== 'super_admin' && role !== 'account_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, email, role: inviteRole, college_id } = await req.json()
    if (!name || !email || !inviteRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service client for admin invite
    const admin = createServiceClient()
    const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { name, role: inviteRole, college_id: college_id || null },
    })
    if (inviteError) throw inviteError

    // Create user profile record
    if (data?.user) {
      await admin.from('users').insert({
        auth_id: data.user.id,
        name,
        email,
        role: inviteRole,
        college_id: college_id || null,
        status: 'active',
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[invite-user]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
