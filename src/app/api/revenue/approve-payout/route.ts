import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { payoutId } = await req.json()
  if (!payoutId) return NextResponse.json({ error: 'payoutId required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: payout, error: fetchErr } = await supabase.from('payouts')
    .select('college_id, amount, period').eq('id', payoutId).single()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const { error } = await supabase.from('payouts').update({
    status: 'paid',
    approved_at: new Date().toISOString(),
  }).eq('id', payoutId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also mark the revenue_share row as paid if period matches
  await supabase.from('revenue_share').update({ payout_status: 'paid' })
    .eq('college_id', payout.college_id)
    .eq('period', payout.period)
    .eq('payout_status', 'pending')

  await supabase.from('activity_events').insert({
    college_id: payout.college_id,
    entity_type: 'revenue',
    entity_id: payoutId,
    event_type: 'revenue.payout_approved',
    title: `Revenue payout approved: ₹${((payout.amount || 0) / 100000).toFixed(2)}L`,
    payload: { period: payout.period, amount: payout.amount },
  })

  return NextResponse.json({ success: true })
}
