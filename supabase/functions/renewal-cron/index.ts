/**
 * renewal-cron — Supabase Edge Function (Deno)
 *
 * Runs daily. Scans for MOUs expiring in ≤ 30 days.
 * Creates notifications, logs events, fires Telegram alerts.
 *
 * Deploy: supabase functions deploy renewal-cron
 * Cron: supabase functions schedule renewal-cron --cron "0 3 * * *"  (3am UTC = 8:30am IST)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')

  const now = new Date()
  const in30days = new Date(now.getTime() + 30 * 86400 * 1000)

  // Find MOUs expiring within 30 days
  const { data: expiringMOUs, error } = await supabase
    .from('mous')
    .select('id, title, expiry_date, college_id, colleges(name, code)')
    .gte('expiry_date', now.toISOString())
    .lte('expiry_date', in30days.toISOString())
    .eq('status', 'active')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const processed: string[] = []

  for (const mou of expiringMOUs || []) {
    const daysLeft = Math.ceil((new Date(mou.expiry_date).getTime() - now.getTime()) / 86400000)
    const collegeCode = (mou.colleges as any)?.code
    const collegeName = (mou.colleges as any)?.name

    // Update MOU status to 'expiring'
    await supabase.from('mous').update({ status: 'expiring' }).eq('id', mou.id)

    // Log activity event
    await supabase.from('activity_events').insert({
      college_id: mou.college_id,
      entity_type: 'mou',
      entity_id: mou.id,
      event_type: 'mou.expiring',
      title: `MOU expiring in ${daysLeft} days — ${collegeCode}`,
      payload: { daysLeft, expiryDate: mou.expiry_date },
    })

    // Find TPO users for this college
    const { data: tpoUsers } = await supabase
      .from('users')
      .select('auth_id')
      .eq('college_id', mou.college_id)
      .in('role', ['tpo', 'hod'])

    // Create in-app notifications
    if (tpoUsers?.length) {
      const notifs = tpoUsers.map(u => ({
        recipient_user_id: u.auth_id,
        title: `MOU Renewal Required — ${daysLeft} days left`,
        body: `Your MOU with Skill Tank expires on ${new Date(mou.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Please initiate renewal.`,
        type: 'mou.expiring',
        status: 'sent', read: false,
      }))
      await supabase.from('notifications').insert(notifs)
    }

    // Telegram alert
    if (telegramToken && chatId) {
      const urgency = daysLeft <= 7 ? '🚨 URGENT' : daysLeft <= 14 ? '⚠️ WARNING' : '📋 INFO'
      const msg = `${urgency}: MOU Expiring\n\n🏛 *${collegeName}* (${collegeCode})\n📅 Expires: ${mou.expiry_date}\n⏳ ${daysLeft} days left\n\nAction needed: Initiate renewal in CareerOS Admin Portal`

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
      })
    }

    processed.push(collegeCode)
  }

  return new Response(JSON.stringify({
    success: true,
    processed: processed.length,
    colleges: processed,
    timestamp: now.toISOString(),
  }))
})
