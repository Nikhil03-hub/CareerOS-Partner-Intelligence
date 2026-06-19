import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, body, type, targetRole } = await req.json()
    if (!title || !type) return NextResponse.json({ error: 'Missing title or type' }, { status: 400 })

    const admin = createServiceClient()

    let userQuery = admin.from('users').select('auth_id').eq('status', 'active')
    if (targetRole && targetRole !== 'all') userQuery = userQuery.eq('role', targetRole)
    const { data: users, error: usersErr } = await userQuery.limit(500)
    if (usersErr) throw usersErr

    if (!users?.length) return NextResponse.json({ error: 'No active users found for target role' }, { status: 404 })

    const notifs = users.map(u => ({
      recipient_user_id: u.auth_id,
      title,
      body: body || '',
      type,
      status: 'sent',
      read: false,
    }))

    for (let i = 0; i < notifs.length; i += 100) {
      const { error: insertErr } = await admin.from('notifications').insert(notifs.slice(i, i + 100))
      if (insertErr) throw insertErr
    }

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (telegramToken && chatId) {
      const message = `CareerOS Broadcast\n\n${title}\n${body || ''}\n\nType: ${type} | To: ${targetRole || 'all'}`
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, sent: notifs.length })
  } catch (err: any) {
    console.error('[notifications/broadcast]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
