import { createClient } from '@/lib/supabase/server'
import { getStatusBadge, formatDate, formatDaysUntil, cn } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminMOUsPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = await createClient()
  const statusFilter = searchParams.status || 'all'

  let query = supabase.from('mous')
    .select('id, title, status, expiry_date, seats_purchased, seats_used, revenue_share_pct, accrued_share_inr, colleges(id, name, code)')
    .order('expiry_date', { ascending: true })

  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  const { data: mous } = await query

  const expiring = mous?.filter(m => m.status === 'expiring').length || 0
  const expired = mous?.filter(m => m.status === 'expired').length || 0
  const active = mous?.filter(m => m.status === 'active').length || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>MOU Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{mous?.length || 0} MOUs across all partner colleges</p>
        </div>
      </div>

      {/* Alert banner */}
      {expiring > 0 && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm font-medium text-yellow-800">
            {expiring} MOU{expiring > 1 ? 's' : ''} expiring within 30 days — action required
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card"><p className="stat-label">Active</p><p className="stat-value text-green-600">{active}</p></div>
        <div className="stat-card"><p className="stat-label">Expiring Soon</p><p className="stat-value text-yellow-600">{expiring}</p></div>
        <div className="stat-card"><p className="stat-label">Expired</p><p className="stat-value text-red-500">{expired}</p></div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        {['all', 'active', 'expiring', 'expired'].map(s => (
          <Link key={s} href={`/admin/mous?status=${s}`}
            className={cn('px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'
            )}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>College</th>
              <th>Title</th>
              <th>Expiry</th>
              <th>Time Left</th>
              <th>Seats</th>
              <th>Revenue Share</th>
              <th>Accrued</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mous?.map(m => {
              const daysLeft = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000)
              return (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td>
                    <Link href={`/admin/colleges/${(m.colleges as any)?.id}`} className="font-semibold text-primary hover:underline text-sm">
                      {(m.colleges as any)?.code}
                    </Link>
                  </td>
                  <td className="text-sm max-w-[200px] truncate">{m.title}</td>
                  <td className="text-sm">{formatDate(m.expiry_date)}</td>
                  <td>
                    <span className={cn('text-xs font-semibold',
                      daysLeft < 0 ? 'text-red-500' : daysLeft < 30 ? 'text-yellow-600' : 'text-green-600'
                    )}>{formatDaysUntil(m.expiry_date)}</span>
                  </td>
                  <td className="text-sm">{m.seats_used || 0}/{m.seats_purchased || 0}</td>
                  <td className="text-sm">{m.revenue_share_pct}%</td>
                  <td className="text-sm font-semibold text-green-600">₹{((m.accrued_share_inr || 0) / 100000).toFixed(2)}L</td>
                  <td><span className={getStatusBadge(m.status)}>{m.status}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(mous?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No MOUs found</p>
        )}
      </div>
    </div>
  )
}
