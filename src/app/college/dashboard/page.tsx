import { createClient } from '@/lib/supabase/server'
import { formatLPA, formatDate, getStatusBadge, calcHealthColor, calcHealthLabel } from '@/lib/utils'
import { Users, TrendingUp, BookOpen, Award, AlertTriangle, DollarSign } from 'lucide-react'
import { StatsCard } from '@/components/shared/StatsCard'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export default async function CollegeDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id
  if (!collegeId) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Your account is pending approval. You'll receive an email once activated.</p>
      </div>
    )
  }

  const [
    college,
    { count: totalStudents },
    { count: placedStudents },
    { count: inProcessStudents },
    { count: totalEnrollments },
    recentPlacements,
    activeCohorts,
    mou,
    recentEvents,
    revShare,
    fdpSessions,
  ] = await Promise.all([
    supabase.from('colleges').select('*').eq('id', collegeId).single(),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('college_id', collegeId).eq('placement_status', 'placed'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('college_id', collegeId).eq('placement_status', 'in_process'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
    supabase.from('students').select('name, placement_status, skills, readiness_score').eq('college_id', collegeId).eq('placement_status', 'placed').order('id', { ascending: false }).limit(5),
    supabase.from('cohorts').select('id, name, enrolled_count, completion_pct, status, programs(name)').eq('college_id', collegeId).eq('status', 'active').limit(4),
    supabase.from('mous').select('title, expiry_date, status, seats_purchased, seats_used').eq('college_id', collegeId).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('activity_events').select('id, title, event_type, created_at').eq('college_id', collegeId).order('created_at', { ascending: false }).limit(8),
    supabase.from('revenue_share').select('gross_amount, share_amount, period, payout_status').eq('college_id', collegeId).order('period', { ascending: false }).limit(1).single(),
    supabase.from('fdp_sessions').select('id, title, date, status, registered_count').eq('college_id', collegeId).order('date', { ascending: false }).limit(3),
  ])

  const health = college.data?.health_score || 0
  const placementRate = totalStudents ? Math.round(((placedStudents || 0) / totalStudents) * 100) : 0
  const mouDaysLeft = mou.data ? Math.ceil((new Date(mou.data.expiry_date).getTime() - Date.now()) / 86400000) : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1>{college.data?.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{college.data?.city}, {college.data?.state} · {college.data?.type}</p>
        </div>
        <div className="text-right">
          <div className={cn('text-3xl font-bold', calcHealthColor(health))}>{health}</div>
          <div className="text-xs text-muted-foreground">Health Score</div>
          <div className={cn('text-xs font-medium', calcHealthColor(health))}>{calcHealthLabel(health)}</div>
        </div>
      </div>

      {/* MOU expiry alert */}
      {mouDaysLeft !== null && mouDaysLeft <= 30 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm font-medium text-yellow-800">
              {mouDaysLeft <= 0 ? 'Your MOU has expired.' : `MOU expires in ${mouDaysLeft} days.`} Renewal required to continue services.
            </p>
          </div>
          <Link href="/college/mou" className="text-sm bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-500 transition-colors whitespace-nowrap ml-4">
            View MOU
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Students" value={(totalStudents || 0).toLocaleString()} icon={Users} />
        <StatsCard title="Placed" value={`${placementRate}%`} delta={`${placedStudents || 0} students`} trend="up" icon={TrendingUp} />
        <StatsCard title="Active Enrollments" value={(totalEnrollments || 0).toLocaleString()} icon={BookOpen} />
        <StatsCard title="FDP Sessions" value={(fdpSessions.data?.length || 0).toString()} icon={Award} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active cohorts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3>Active Training Cohorts</h3>
              <Link href="/college/training" className="text-xs text-primary hover:underline">All →</Link>
            </div>
            {(activeCohorts.data?.length || 0) === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No active cohorts</p>
            ) : (
              <div className="divide-y">
                {activeCohorts.data?.map(c => (
                  <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{(c.programs as any)?.name} · {c.enrolled_count} students</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-24 h-1.5 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${c.completion_pct}%` }} />
                        </div>
                        <span className="text-xs font-medium">{c.completion_pct?.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent placements */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3>Recent Placements</h3>
              <Link href="/college/placements" className="text-xs text-primary hover:underline">All →</Link>
            </div>
            {(recentPlacements.data?.length || 0) === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No placements yet</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Student</th><th>Readiness</th><th>Skills</th></tr></thead>
                <tbody>
                  {recentPlacements.data?.map((s, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="font-medium text-sm">{s.name}</td>
                      <td>
                        <span className={cn('font-semibold text-sm',
                          (s.readiness_score || 0) >= 80 ? 'text-green-600' : (s.readiness_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-500'
                        )}>{s.readiness_score}%</span>
                      </td>
                      <td className="text-xs text-muted-foreground">{(s.skills as string[])?.slice(0, 3).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Revenue */}
          {revShare.data && (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Revenue Share</h3>
                <Link href="/college/revenue" className="text-xs text-primary hover:underline">Details →</Link>
              </div>
              <p className="text-2xl font-bold">₹{((revShare.data.share_amount || 0) / 100000).toFixed(2)}L</p>
              <p className="text-xs text-muted-foreground mt-0.5">{revShare.data.period} · <span className={cn(revShare.data.payout_status === 'paid' ? 'text-green-600' : 'text-yellow-600')}>{revShare.data.payout_status}</span></p>
            </div>
          )}

          {/* Activity */}
          <div className="rounded-xl border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">Activity</h3>
            </div>
            <div className="divide-y max-h-60 overflow-y-auto">
              {recentEvents.data?.map(e => (
                <div key={e.id} className="px-4 py-2.5">
                  <p className="text-xs font-medium leading-tight">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(e.created_at)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FDP sessions */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">FDP Sessions</h3>
              <Link href="/college/fdp" className="text-xs text-primary hover:underline">All →</Link>
            </div>
            <div className="divide-y">
              {fdpSessions.data?.map(s => (
                <div key={s.id} className="px-4 py-3">
                  <p className="text-xs font-medium leading-tight">{s.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{formatDate(s.date)}</p>
                    <span className={getStatusBadge(s.status)}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
