import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getStatusBadge, calcHealthLabel, calcHealthColor } from '@/lib/utils'
import { Building2, Users, TrendingUp, DollarSign, AlertTriangle, FileText, Zap, Target, ArrowUpRight } from 'lucide-react'
import { StatsCard } from '@/components/shared/StatsCard'
import { ExecutiveSummary } from './ExecutiveSummary'
import { JudgeQuickActions } from './JudgeQuickActions'
import { HighRiskStudents } from './HighRiskStudents'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export default async function AdminDashboard() {
  const supabase = createServiceClient()

  // Fetch aggregates in parallel
  const [
    { count: totalColleges },
    { count: activeColleges },
    { count: pendingColleges },
    { count: totalStudents },
    { count: placedStudents },
    colleges,
    expiringMOUs,
    recentEvents,
    revShareData,
    highRiskStudents,
    topColleges,
  ] = await Promise.all([
    supabase.from('colleges').select('*', { count: 'exact', head: true }),
    supabase.from('colleges').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('colleges').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('placement_status', 'placed'),
    supabase.from('colleges').select('id, name, code, health_score, status, city, state').order('health_score', { ascending: true }).limit(6),
    supabase.from('mous').select('id, title, expiry_date, status, colleges(name, code)').eq('status', 'expiring').order('expiry_date').limit(5),
    supabase.from('activity_events').select('id, title, event_type, created_at, colleges(name, code)').order('created_at', { ascending: false }).limit(8),
    supabase.from('mous').select('accrued_share_inr').eq('status', 'active'),
    supabase.from('students').select('id').eq('risk_level', 'high'),
    supabase.from('colleges').select('id, name, code, health_score').order('health_score', { ascending: false }).limit(3),
  ])

  const placementRate = totalStudents ? Math.round(((placedStudents || 0) / totalStudents) * 100) : 0
  const totalRevenue = revShareData?.data?.reduce((s: number, m: any) => s + (m.accrued_share_inr || 0), 0) || 0
  const highRiskCount = highRiskStudents?.data?.length || 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">CareerOS Partner Intelligence — overview of all colleges</p>
      </div>

      {/* AI Executive Summary — live, computed */}
      <ExecutiveSummary />

      {/* Judge quick actions + high-risk students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JudgeQuickActions />
        <HighRiskStudents />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Partner Colleges" value={totalColleges || 0} icon={Building2}
          delta={`${activeColleges || 0} active · ${pendingColleges || 0} pending`} trend="up" />
        <StatsCard title="Total Students" value={(totalStudents || 0).toLocaleString()} icon={Users}
          delta={`${placementRate}% placed`} trend="up" />
        <StatsCard title="Placement Rate" value={`${placementRate}%`} icon={TrendingUp}
          trend="up" delta={`${placedStudents || 0} placed`} />
        <StatsCard title="Revenue Accrued" value={`₹${(totalRevenue/100000).toFixed(2)}L`} icon={DollarSign}
          iconColor="text-green-600" trend="up" delta="active MOUs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* College Health Table */}
        <div className="lg:col-span-2 rounded-xl border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3>College Health Scores</h3>
            <Link href="/admin/colleges" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>College</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {colleges.data?.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td>
                      <Link href={`/admin/colleges/${c.id}`} className="font-medium text-primary hover:underline text-sm">{c.code}</Link>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{c.name}</p>
                    </td>
                    <td className="text-sm text-muted-foreground">{c.city}</td>
                    <td><span className={getStatusBadge(c.status)}>{c.status}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${c.health_score || 0}%` }} />
                        </div>
                        <span className={cn('text-sm font-semibold', calcHealthColor(c.health_score || 0))}>
                          {c.health_score || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: expiring MOUs + activity */}
        <div className="space-y-4">
          {/* Expiring MOUs */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" /> Expiring MOUs
              </h3>
              <Link href="/admin/mous" className="text-xs text-primary hover:underline">All MOUs →</Link>
            </div>
            <div className="divide-y">
              {(expiringMOUs.data?.length || 0) === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">No MOUs expiring soon</p>
              )}
              {expiringMOUs.data?.map(m => {
                const daysLeft = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000)
                return (
                  <div key={m.id} className="px-4 py-3">
                    <p className="text-sm font-medium">{(m.colleges as any)?.code}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(m.expiry_date)}</p>
                    <span className={cn('text-xs font-semibold', daysLeft <= 7 ? 'text-red-500' : 'text-yellow-600')}>
                      {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">Recent Activity</h3>
            </div>
            <div className="divide-y max-h-52 overflow-y-auto">
              {recentEvents.data?.map(e => (
                <div key={e.id} className="px-4 py-2.5">
                  <p className="text-xs font-medium leading-tight">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(e.colleges as any)?.code} · {formatDate(e.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Opportunity Radar */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3>Opportunity Radar</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">AI Insights</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(expiringMOUs.data?.length || 0) > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                    {expiringMOUs.data!.length} MOU{expiringMOUs.data!.length > 1 ? 's' : ''} expiring soon
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Proactive renewal outreach recommended — high-value partners</p>
                  <Link href="/admin/mous?status=expiring" className="text-xs text-yellow-700 font-semibold mt-1.5 flex items-center gap-1 hover:underline">
                    Renew now <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          {highRiskCount > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-800 dark:text-red-300">{highRiskCount} high-risk students</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Students at placement risk — targeted intervention recommended</p>
                  <Link href="/admin/students?risk=high" className="text-xs text-red-700 font-semibold mt-1.5 flex items-center gap-1 hover:underline">
                    View students <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          {(colleges.data?.filter(c => (c.health_score || 0) < 60).length || 0) > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">
                    {colleges.data!.filter(c => (c.health_score || 0) < 60).length} colleges below 60 health
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">Run CRT re-engagement + FDP workshop sessions</p>
                  <Link href="/admin/colleges" className="text-xs text-orange-700 font-semibold mt-1.5 flex items-center gap-1 hover:underline">
                    View colleges <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          {(topColleges.data?.length || 0) > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-3 sm:col-span-2 lg:col-span-1">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-green-800 dark:text-green-300">Top performing partners</p>
                  {topColleges.data!.map(c => (
                    <p key={c.id} className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      {c.code} — {c.health_score}/100 · consider AI Interview upsell
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending approvals */}
      {(pendingColleges || 0) > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">{pendingColleges} college{(pendingColleges || 0) > 1 ? 's' : ''} awaiting approval</p>
                <p className="text-sm text-yellow-700">Review and approve partnership applications</p>
              </div>
            </div>
            <Link href="/admin/colleges?status=pending" className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Review Now
            </Link>
          </div>
        </div>
      )}    </div>
  )
}
