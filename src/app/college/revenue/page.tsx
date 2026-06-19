import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStatusBadge, formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RevenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  const [revShare, payouts, mou] = await Promise.all([
    supabase.from('revenue_share').select('*').eq('college_id', collegeId).order('period', { ascending: false }),
    supabase.from('payouts').select('*').eq('college_id', collegeId).order('created_at', { ascending: false }),
    supabase.from('mous').select('revenue_share_pct, accrued_share_inr, seats_purchased, seats_used')
      .eq('college_id', collegeId).order('created_at', { ascending: false }).limit(1).single(),
  ])

  const totalGross = revShare.data?.reduce((a, r) => a + (r.gross_amount || 0), 0) || 0
  const totalShare = revShare.data?.reduce((a, r) => a + (r.share_amount || 0), 0) || 0
  const pendingShare = revShare.data?.filter(r => r.payout_status === 'pending').reduce((a, r) => a + (r.share_amount || 0), 0) || 0
  const paidOut = payouts.data?.filter(p => p.status === 'paid').reduce((a, p) => a + (p.amount || 0), 0) || 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Revenue Share</h1>
        <p className="text-muted-foreground text-sm mt-1">Your revenue share with Skill Tank · {mou.data?.revenue_share_pct}% rate</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /><p className="stat-label">Accrued Total</p></div>
          <p className="stat-value text-green-600">₹{(totalShare / 100000).toFixed(2)}L</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-yellow-500" /><p className="stat-label">Pending Payout</p></div>
          <p className="stat-value text-yellow-600">₹{(pendingShare / 100000).toFixed(2)}L</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="h-4 w-4 text-green-500" /><p className="stat-label">Paid Out</p></div>
          <p className="stat-value">₹{(paidOut / 100000).toFixed(2)}L</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><p className="stat-label">Gross Revenue</p></div>
          <p className="stat-value">₹{(totalGross / 100000).toFixed(2)}L</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue share by quarter */}
        <div className="rounded-xl border bg-card overflow-auto">
          <div className="px-5 py-4 border-b"><h3>Revenue Share by Quarter</h3></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Gross</th>
                <th>Share %</th>
                <th>Share Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {revShare.data?.map((r, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="font-medium text-sm">{r.period}</td>
                  <td className="text-sm">₹{((r.gross_amount || 0) / 100000).toFixed(2)}L</td>
                  <td className="text-sm">{r.share_pct}%</td>
                  <td className="text-sm font-semibold text-green-600">₹{((r.share_amount || 0) / 100000).toFixed(2)}L</td>
                  <td><span className={getStatusBadge(r.payout_status)}>{r.payout_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(revShare.data?.length || 0) === 0 && (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">No revenue share records yet</p>
          )}
        </div>

        {/* Payout history */}
        <div className="rounded-xl border bg-card overflow-auto">
          <div className="px-5 py-4 border-b"><h3>Payout History</h3></div>
          <table className="data-table">
            <thead><tr><th>Period</th><th>Amount</th><th>Approved</th><th>Status</th></tr></thead>
            <tbody>
              {payouts.data?.map((p, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="font-medium text-sm">{p.period}</td>
                  <td className="text-sm font-semibold text-green-600">₹{((p.amount || 0) / 100000).toFixed(2)}L</td>
                  <td className="text-xs text-muted-foreground">{p.approved_at ? formatDate(p.approved_at) : '—'}</td>
                  <td><span className={getStatusBadge(p.status)}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(payouts.data?.length || 0) === 0 && (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">No payout records yet</p>
          )}
        </div>
      </div>

      {/* MOU seat utilization */}
      {mou.data && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4">Seat Utilization</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Seats Used</span>
                <span className="font-semibold">{mou.data.seats_used} / {mou.data.seats_purchased}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, ((mou.data.seats_used || 0) / (mou.data.seats_purchased || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(((mou.data.seats_used || 0) / (mou.data.seats_purchased || 1)) * 100)}% utilization
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
