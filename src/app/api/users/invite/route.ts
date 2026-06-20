import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = user.user_metadata?.role
    if (role !== 'super_admin' && role !== 'account_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, email, role: inviteRole, college_id, password } = await req.json()
    if (!name || !email || !inviteRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const collegeRoles = ['tpo', 'hod', 'faculty_coord', 'club_coord']
    if (collegeRoles.includes(inviteRole) && !college_id) {
      return NextResponse.json({ error: 'This role requires a college.' }, { status: 400 })
    }

    const admin = createServiceClient()
    const tempPassword = password || 'careeros2026'

    const { data, error: createError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role: inviteRole, college_id: college_id || null },
    })

    if (createError) {
      const msg = createError.message?.toLowerCase() || ''
      if ((createError as any).code === 'email_exists' || msg.includes('already') || msg.includes('registered')) {
        return NextResponse.json({ error: 'A user with that email already exists. Use a different email.' }, { status: 409 })
      }
      throw createError
    }

    if (data?.user) {
      const { error: insertError } = await admin.from('users').insert({
        auth_id: data.user.id,
        name,
        email,
        role: inviteRole,
        college_id: college_id || null,
        status: 'active',
      })
      if (insertError) {
        await admin.auth.admin.deleteUser(data.user.id)
        throw new Error('Profile creation failed: ' + insertError.message)
      }
    }

    revalidatePath('/admin/users')
    return NextResponse.json({ success: true, tempPassword })
  } catch (err: any) {
    console.error('[invite-user]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
