import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/notifications/generate-alerts
// Scans the live DB and creates notification records for real triggers:
// 1. MOUs expiring in ≤30 days
// 2. Cohort completion < 50% (in_progress cohorts)
// 3. Students risk_level = 'high' count > threshold
// 4. Revenue share overdue

export async function POST() {
  const supabase = createServiceClient()
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 86400_000).toISOString().slice(0, 10)
  const in10Days = new Date(now.getTime() + 10 * 86400_000).toISOString().slice(0, 10)

  const created: string[] = []
  const errors: string[] = []

  async function createNotification(n: {
    college_id?: string
    type: string
    title: string
    body: string
    channels?: string[]
  }) {
    const { data, error } = await supabase.from('notifications').insert({
      college_id: n.college_id || null,
      type: n.type,
      title: n.title,
      body: n.body,
      channels: n.channels || ['in_app'],
      status: 'sent',
      read: false,
    }).select('id').single()
    if (error) errors.push(error.message)
    else if (data) created.push(data.id)
  }

  // ── 1. MOU expiry alerts ─────────────────────────────────
  const { data: mous } = await supabase
    .from('mous')
    .select('id, college_id, title, expiry_date, status, colleges(name, code)')
    .in('status', ['active', 'expiring'])
    .lte('expiry_date', in30Days)
    .gte('expiry_date', now.toISOString().slice(0, 10))

  for (const mou of mous || []) {
    const college = (mou.colleges as any)
    const daysLeft = Math.round((new Date(mou.expiry_date).getTime() - now.getTime()) / 86400_000)
    const isUrgent = mou.expiry_date <= in10Days
    await createNotification({
      college_id: mou.college_id,
      type: 'mou.expiring',
      title: `MOU expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — ${college?.code || ''}`,
      body: `The MOU "${mou.title}" for ${college?.name || ''} expires on ${new Date(mou.expiry_date).toLocaleDateString('en-IN')}. ${isUrgent ? '⚠️ Urgent: initiate renewal immediately.' : 'Please initiate renewal process.'}`,
      channels: isUrgent ? ['in_app', 'email', 'telegram'] : ['in_app'],
    })

    // Update MOU status to 'expiring' if within 30 days
    await supabase.from('mous').update({ status: 'expiring' }).eq('id', mou.id)
  }

  // ── 2. Low completion alerts ──────────────────────────────
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, college_id, name, completion_pct, enrolled_count, colleges(name, code)')
    .eq('status', 'in_progress')
    .lt('completion_pct', 50)

  for (const cohort of cohorts || []) {
    const college = (cohort.colleges as any)
    await createNotification({
      college_id: cohort.college_id,
      type: 'training.low_completion',
      title: `Low training completion — ${college?.code || ''}`,
      body: `Cohort "${cohort.name}" has only ${cohort.completion_pct}% completion with ${cohort.enrolled_count} students enrolled. Intervention recommended.`,
      channels: ['in_app'],
    })
  }

  // ── 3. High-risk student concentration alerts ─────────────
  const { data: highRiskStats } = await supabase
    .from('students')
    .select('college_id, risk_level, colleges(name, code)')
    .eq('risk_level', 'high')

  const riskByCollege: Record<string, { count: number; name: string; code: string; college_id: string }> = {}
  for (const s of highRiskStats || []) {
    if (!s.college_id) continue
    if (!riskByCollege[s.college_id]) {
      riskByCollege[s.college_id] = {
        count: 0,
        name: (s.colleges as any)?.name || '',
        code: (s.colleges as any)?.code || '',
        college_id: s.college_id,
      }
    }
    riskByCollege[s.college_id].count++
  }

  for (const [cId, stat] of Object.entries(riskByCollege)) {
    if (stat.count >= 10) {
      await createNotification({
        college_id: cId,
        type: 'student.high_risk_cluster',
        title: `${stat.count} high-risk students — ${stat.code}`,
        body: `${stat.name} has ${stat.count} students classified as high placement risk. Review intervention plan and schedule counselling sessions.`,
        channels: ['in_app', 'email'],
      })
    }
  }

  // ── 4. Revenue overdue alerts ─────────────────────────────
  const { data: overdueRevenue } = await supabase
    .from('revenue_share')
    .select('id, college_id, period, share_amount, colleges(name, code)')
    .eq('payout_status', 'pending')

  for (const rev of (overdueRevenue || []).slice(0, 5)) {
    const college = (rev.colleges as any)
    await createNotification({
      college_id: rev.college_id,
      type: 'payment.overdue',
      title: `Revenue payout pending — ${college?.code || ''}`,
      body: `₹${((rev.share_amount || 0) / 100000).toFixed(2)}L revenue share for period ${rev.period} is pending approval for ${college?.name || ''}.`,
      channels: ['in_app'],
    })
  }

  // ── Send Telegram for urgent alerts ──────────────────────
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (telegramToken && chatId && mous && mous.length > 0) {
    const urgentMOUs = (mous || []).filter(m => m.expiry_date <= in10Days)
    if (urgentMOUs.length > 0) {
      const msg = [
        '🚨 *CareerOS Alert — MOU Expiry*',
        '',
        ...urgentMOUs.map(m => `• ${(m.colleges as any)?.code}: expires ${new Date(m.expiry_date).toLocaleDateString('en-IN')}`),
        '',
        `_${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST_`,
      ].join('\n')

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
      }).catch(() => { /* ignore telegram errors */ })
    }
  }

  return NextResponse.json({
    success: true,
    created: created.length,
    breakdown: {
      mouExpiry: (mous || []).length,
      lowCompletion: (cohorts || []).length,
      highRisk: Object.values(riskByCollege).filter(s => s.count >= 10).length,
      revenueOverdue: Math.min(5, (overdueRevenue || []).length),
    },
    errors: errors.slice(0, 5),
  })
}
