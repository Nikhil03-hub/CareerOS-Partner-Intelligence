import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDaysUntil, getStatusBadge, calcHealthColor, calcHealthLabel, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ArrowLeft, Building2, Users, TrendingUp, DollarSign, FileText, Award } from 'lucide-react'
import { HealthScoreBreakdown } from './HealthScoreBreakdown'

export const dynamic = 'force-dynamic'

export default async function CollegeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { id } = params

  const [college, students, mou, cohorts, revShare, fdp, placements, events] = await Promise.all([
    supabase.from('colleges').select('*').eq('id', id).single(),
    supabase.from('students').select('placement_status, risk_level, readiness_score, cgpa').eq('college_id', id),
    supabase.from('mous').select('*').eq('college_id', id).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('cohorts').select('id, name, enrolled_count, completion_pct, status').eq('college_id', id).limit(5),
    supabase.from('revenue_share').select('gross_amount, share_amount, period, payout_status').eq('college_id', id).order('period', { ascending: false }).limit(4),
    supabase.from('fdp_sessions').select('id, title, date, status').eq('college_id', id).order('date', { ascending: false }).limit(5),
    supabase.from('placement_records').select('academic_year, company, selects, ctc_lpa').eq('college_id', id).order('academic_year', { ascending: false }).limit(10),
    supabase.from('activity_events').select('title, event_type, created_at').eq('college_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  if (!college.data) notFound()
  const c = college.data
  const stuList = students.data || []
  const placed = stuList.filter(s => s.placement_status === 'placed').length
  const highRisk = stuList.filter(s => s.risk_level === 'high').length
  const placementRate = stuList.length ? Math.round((placed / stuList.length) * 100) : 0
  const avgReadiness = stuList.length ? Math.round(stuList.reduce((a, s) => a + (s.readiness_score || 0), 0) / stuList.length) : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/colleges" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1>{c.name}</h1>
            <span className={getStatusBadge(c.status)}>{c.status}</span>
          </div>
          <p className="text-muted-foreground text-sm">{c.city}, {c.state} · {c.university} · {c.type}</p>
        </div>
        <div className="text-right">
          <div className={cn('text-3xl font-bold', calcHealthColor(c.health_score || 0))}>{c.health_score || 0}</div>
          <div className="text-xs text-muted-foreground">{calcHealthLabel(c.health_score || 0)}</div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Students</p>
          <p className="stat-value">{stuList.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Placement Rate</p>
          <p className="stat-value">{placementRate}%</p>
          <p className="stat-delta up">↑ {placed} placed</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Readiness</p>
          <p className="stat-value">{avgReadiness}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">At-Risk Students</p>
          <p className={cn('stat-value', highRisk > 0 ? 'text-red-500' : '')}>{highRisk}</p>
        </div>
      </div>

      {/* AI Health Score Breakdown — full width */}
      <HealthScoreBreakdown collegeId={id} initialScore={c.health_score} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MOU */}
        {mou.data && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> MOU Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={getStatusBadge(mou.data.status)}>{mou.data.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expiry</span><span>{formatDate(mou.data.expiry_date)} ({formatDaysUntil(mou.data.expiry_date)})</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Seats</span><span>{mou.data.seats_used}/{mou.data.seats_purchased}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Revenue Share</span><span>{mou.data.revenue_share_pct}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Accrued</span><span>₹{((mou.data.accrued_share_inr || 0) / 100000).toFixed(2)}L</span></div>
            </div>
          </div>
        )}

        {/* Recent placements */}
        <div className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Recent Placements</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>Year</th><th>Company</th><th>Selects</th><th>CTC</th></tr></thead>
            <tbody>
              {placements.data?.map((p, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="text-xs text-muted-foreground">{p.academic_year}</td>
                  <td className="text-sm font-medium">{p.company}</td>
                  <td className="text-sm">{p.selects}</td>
                  <td className="text-sm font-semibold text-green-600">₹{p.ctc_lpa}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue share */}
        <div className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b"><h3>Revenue Share History</h3></div>
          <table className="data-table">
            <thead><tr><th>Period</th><th>Gross</th><th>Share</th><th>Status</th></tr></thead>
            <tbody>
              {revShare.data?.map((r, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="text-sm">{r.period}</td>
                  <td className="text-sm">₹{((r.gross_amount || 0) / 100000).toFixed(1)}L</td>
                  <td className="text-sm font-semibold text-green-600">₹{((r.share_amount || 0) / 100000).toFixed(1)}L</td>
                  <td><span className={getStatusBadge(r.payout_status)}>{r.payout_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity */}
        <div className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b"><h3>Activity Timeline</h3></div>
          <div className="divide-y max-h-60 overflow-y-auto">
            {events.data?.map((e, i) => (
              <div key={i} className="px-5 py-3">
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(e.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
