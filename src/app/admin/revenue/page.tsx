import { createClient } from '@/lib/supabase/server'
import { getStatusBadge, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ApprovePayoutButton } from './ApprovePayoutButton'

export const dynamic = 'force-dynamic'

export default async function AdminRevenuePage() {
  const supabase = await createClient()

  const [revShare, payouts, summary] = await Promise.all([
    supabase.from('revenue_share')
      .select('*, colleges(name, code)')
      .order('period', { ascending: false })
      .limit(50),
    supabase.from('payouts')
      .select('*, colleges(name, code)')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('revenue_share').select('share_amount, payout_status'),
  ])

  const totalShare = summary.data?.reduce((a, r) => a + (r.share_amount || 0), 0) || 0
  const pendingShare = summary.data?.filter(r => r.payout_status === 'pending').reduce((a, r) => a + (r.share_amount || 0), 0) || 0
  const paidShare = summary.data?.filter(r => r.payout_status === 'paid').reduce((a, r) => a + (r.share_amount || 0), 0) || 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Revenue Share</h1>
        <p className="text-muted-foreground text-sm mt-1">Track revenue share accrual and payout across all colleges</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card"><p className="stat-label">Total Accrued</p><p className="stat-value text-green-600">₹{(totalShare / 100000).toFixed(2)}L</p></div>
        <div className="stat-card"><p className="stat-label">Pending Payout</p><p className="stat-value text-yellow-600">₹{(pendingShare / 100000).toFixed(2)}L</p></div>
        <div className="stat-card"><p className="stat-label">Paid Out</p><p className="stat-value">₹{(paidShare / 100000).toFixed(2)}L</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card overflow-auto">
          <div className="px-5 py-4 border-b"><h3>Revenue Share by College</h3></div>
          <table className="data-table">
            <thead><tr><th>College</th><th>Period</th><th>Gross</th><th>Share</th><th>Status</th></tr></thead>
            <tbody>
              {revShare.data?.map((r, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td>
                    <Link href={`/admin/colleges/${(r.colleges as any)?.id}`} className="text-sm font-semibold text-primary hover:underline">{(r.colleges as any)?.code}</Link>
                  </td>
                  <td className="text-sm">{r.period}</td>
                  <td className="text-sm">₹{((r.gross_amount || 0) / 100000).toFixed(1)}L</td>
                  <td className="text-sm font-semibold text-green-600">₹{((r.share_amount || 0) / 100000).toFixed(1)}L</td>
                  <td><span className={getStatusBadge(r.payout_status)}>{r.payout_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border bg-card overflow-auto">
          <div className="px-5 py-4 border-b"><h3>Payouts</h3></div>
          <table className="data-table">
            <thead><tr><th>College</th><th>Period</th><th>Amount</th><th>Approved</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {payouts.data?.map((p, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td><Link href={`/admin/colleges/${(p.colleges as any)?.id}`} className="text-sm font-semibold text-primary hover:underline">{(p.colleges as any)?.code}</Link></td>
                  <td className="text-sm">{p.period}</td>
                  <td className="text-sm font-semibold text-green-600">₹{((p.amount || 0) / 100000).toFixed(1)}L</td>
                  <td className="text-xs text-muted-foreground">{p.approved_at ? formatDate(p.approved_at) : '—'}</td>
                  <td><span className={getStatusBadge(p.status)}>{p.status}</span></td>
                  <td>
                    {p.status === 'pending' && <ApprovePayoutButton payoutId={p.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
