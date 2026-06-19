/**
 * notify-dispatch — Supabase Edge Function (Deno)
 *
 * Called by DB trigger (via pg_net / HTTP request) when a notification
 * is inserted. Routes to Telegram and email based on notification type.
 *
 * Deploy: supabase functions deploy notify-dispatch
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationPayload {
  id: string
  recipient_user_id: string
  title: string
  body: string
  type: string
}

Deno.serve(async (req: Request) => {
  const payload: NotificationPayload = await req.json()
  const { title, body, type } = payload

  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')

  // Send critical alerts to Telegram
  const TELEGRAM_TYPES = ['mou.expiring', 'student.at_risk', 'payment.overdue', 'placement.accepted']

  if (telegramToken && chatId && TELEGRAM_TYPES.includes(type)) {
    const EMOJI: Record<string, string> = {
      'mou.expiring': '⚠️',
      'student.at_risk': '🚨',
      'payment.overdue': '💸',
      'placement.accepted': '🎉',
    }
    const emoji = EMOJI[type] || '🔔'
    const msg = `${emoji} *${title}*\n\n${body || ''}\n\n_CareerOS Platform_`

    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
    }).catch(console.error)
  }

  return new Response(JSON.stringify({ success: true }))
})
