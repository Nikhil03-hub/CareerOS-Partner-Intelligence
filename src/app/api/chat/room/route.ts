import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/chat/room — get or create the chat room for this college
export async function GET(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const collegeId = user.user_metadata?.college_id
    if (!collegeId) return NextResponse.json({ error: 'No college' }, { status: 400 })

    const supabase = createServiceClient()

    // Get or create chat room
    let { data: room } = await supabase.from('chat_rooms')
      .select('id, college_id, account_manager_id, users(name, email)')
      .eq('college_id', collegeId)
      .single()

    if (!room) {
      const { data: newRoom } = await supabase.from('chat_rooms').insert({
        college_id: collegeId,
      }).select('id, college_id, account_manager_id').single()
      room = newRoom
    }

    return NextResponse.json({ room })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
