import { createClient } from '@/lib/supabase/server'
import { cn, formatLPA, getStatusBadge } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const MEDAL = ['🥇', '🥈', '🥉']

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  // Get all colleges with aggregate stats
  const { data: colleges } = await supabase
    .from('colleges')
    .select('id, name, code, city, state, status, college_health_history(score, captured_at)')
    .eq('status', 'approved')
    .order('name')

  // Get placement counts per college
  const { data: placements } = await supabase
    .from('year_summaries')
    .select('college_id, offers, avg_lpa, academic_year')
    .eq('academic_year', '2025-26')

  // Get student counts per college
  const { data: studentCounts } = await supabase
    .from('students')
    .select('college_id')

  // Get enrollment counts for completion
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('college_id, progress_pct')

  // Get revenue per college
  const { data: revenue } = await supabase
    .from('revenue_share')
    .select('college_id, share_amount')

  // Build leaderboard
  const leaderboard = (colleges || []).map(c => {
    const latestHealth = (c.college_health_history as any[])
      ?.sort((a: any, b: any) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())[0]
    const placement = placements?.find(p => p.college_id === c.id)
    const collegeStudents = studentCounts?.filter(s => s.college_id === c.id) || []
    const collegeEnrollments = enrollments?.filter(e => e.college_id === c.id) || []
    const avgCompletion = collegeEnrollments.length > 0
      ? Math.round(collegeEnrollments.reduce((a, e) => a + (e.progress_pct || 0), 0) / collegeEnrollments.length)
      : 0
    const totalRevenue = revenue?.filter(r => r.college_id === c.id).reduce((a, r) => a + (r.share_amount || 0), 0) || 0
    const placementRate = collegeStudents.length > 0
      ? Math.round(((placement?.offers || 0) / collegeStudents.length) * 100)
      : 0

    return {
      id: c.id,
      name: c.name,
      code: c.code,
      city: c.city,
      healthScore: latestHealth?.score || 0,
      offers: placement?.offers || 0,
      avgLpa: placement?.avg_lpa || 0,
      placementRate: Math.min(100, placementRate),
      completionRate: avgCompletion,
      students: collegeStudents.length,
      revenue: totalRevenue,
      status: c.status,
    }
  })

  // Sort by health score descending
  leaderboard.sort((a, b) => b.healthScore - a.healthScore)

  // Summary stats
  const avgHealth = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((a, c) => a + c.healthScore, 0) / leaderboard.length)
    : 0
  const totalOffers = leaderboard.reduce((a, c) => a + c.offers, 0)
  const totalStudents = leaderboard.reduce((a, c) => a + c.students, 0)
  const totalRev = leaderboard.reduce((a, c) => a + c.revenue, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Analytics & Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          College performance ranking across all partner institutions
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Partner Colleges', value: leaderboard.length, sub: 'approved & active' },
          { label: 'Avg Health Score', value: `${avgHealth}/100`, sub: 'platform average' },
          { label: 'Total Placements 25-26', value: totalOffers.toLocaleString(), sub: 'this academic year' },
          { label: 'Platform Revenue', value: `₹${(totalRev / 100000).toFixed(1)}L`, sub: 'all colleges' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="stat-label">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border bg-card overflow-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3>College Performance Leaderboard</h3>
            <p className="text-xs text-muted-foreground mt-1">Ranked by College Health Score · 2025-26</p>
          </div>
          <span className="text-xs text-muted-foreground">{leaderboard.length} colleges</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th className="w-12">Rank</th>
              <th>College</th>
              <th>Health Score</th>
              <th>Placements</th>
              <th>Avg LPA</th>
              <th>Completion %</th>
              <th>Students</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((c, idx) => {
              const healthColor = c.healthScore >= 70 ? 'text-green-600' : c.healthScore >= 45 ? 'text-yellow-600' : 'text-red-600'
              const healthBg = c.healthScore >= 70 ? 'bg-green-500' : c.healthScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'

              return (
                <tr key={c.id} className={cn('hover:bg-muted/30', idx < 3 ? 'bg-primary/5' : '')}>
                  <td className="text-center">
                    {idx < 3
                      ? <span className="text-lg">{MEDAL[idx]}</span>
                      : <span className="text-sm font-semibold text-muted-foreground">#{idx + 1}</span>
                    }
                  </td>
                  <td>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.code} · {c.city}</p>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full', healthBg)} style={{ width: `${c.healthScore}%` }} />
                      </div>
                      <span className={cn('text-sm font-bold', healthColor)}>{c.healthScore}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-semibold">{c.offers}</span>
                    {c.placementRate > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">({c.placementRate}%)</span>
                    )}
                  </td>
                  <td className="text-sm font-medium text-green-600">
                    {c.avgLpa > 0 ? `₹${c.avgLpa.toFixed(1)}L` : '—'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${c.completionRate}%` }} />
                      </div>
                      <span className="text-xs font-medium">{c.completionRate}%</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground">{c.students.toLocaleString()}</td>
                  <td className="text-sm font-medium">
                    {c.revenue > 0 ? `₹${(c.revenue / 100000).toFixed(1)}L` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {leaderboard.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No approved colleges yet</p>
        )}
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '🟢 High Performers', desc: 'Health ≥ 70', count: leaderboard.filter(c => c.healthScore >= 70).length, color: 'border-green-200 bg-green-50 dark:bg-green-950/20' },
          { label: '🟡 Average Performers', desc: 'Health 45–69', count: leaderboard.filter(c => c.healthScore >= 45 && c.healthScore < 70).length, color: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' },
          { label: '🔴 Needs Attention', desc: 'Health < 45', count: leaderboard.filter(c => c.healthScore < 45).length, color: 'border-red-200 bg-red-50 dark:bg-red-950/20' },
        ].map(band => (
          <div key={band.label} className={cn('rounded-xl border p-4', band.color)}>
            <p className="text-sm font-semibold">{band.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{band.desc}</p>
            <p className="text-3xl font-bold mt-2">{band.count}</p>
            <p className="text-xs text-muted-foreground">colleges</p>
          </div>
        ))}
      </div>
    </div>
  )
}
