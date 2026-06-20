import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/chat/messages?roomId=...
export async function GET(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const roomId = req.nextUrl.searchParams.get('roomId')
    if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 })

    const supabase = createServiceClient()
    const { data: messages } = await supabase.from('messages')
      .select('id, body, created_at, read, sender_user_id, users:sender_user_id(name, role)')
      .eq('chat_room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100)

    return NextResponse.json({ messages: messages || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/chat/messages — send a message
export async function POST(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId, body } = await req.json()
    if (!roomId || !body?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabase = createServiceClient()

    // Get user record
    const { data: userRecord } = await supabase.from('users')
      .select('id').eq('auth_id', user.id).single()

    const { data: message, error } = await supabase.from('messages').insert({
      chat_room_id: roomId,
      sender_user_id: userRecord?.id || null,
      body: body.trim(),
      read: false,
    }).select('id, body, created_at, read, sender_user_id, users:sender_user_id(name, role)').single()

    if (error) throw error

    return NextResponse.json({ message })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
