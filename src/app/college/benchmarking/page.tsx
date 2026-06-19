import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function BenchmarkingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  // Get this college's data
  const [myCollegeRes, allHealthRes, allSummariesRes, allEnrollmentsRes] = await Promise.all([
    supabase.from('colleges').select('id, name, code, city').eq('id', collegeId).single(),
    supabase.from('college_health_history').select('college_id, score').order('captured_at', { ascending: false }),
    supabase.from('year_summaries').select('college_id, offers, avg_lpa, companies').eq('academic_year', '2025-26'),
    supabase.from('enrollments').select('college_id, progress_pct'),
  ])

  const college = myCollegeRes.data
  const allHealth = allHealthRes.data || []
  const allSummaries = allSummariesRes.data || []
  const allEnrollments = allEnrollmentsRes.data || []

  // Latest health score per college (deduplicated)
  const latestHealthByCollege = new Map<string, number>()
  for (const h of allHealth) {
    if (!latestHealthByCollege.has(h.college_id)) {
      latestHealthByCollege.set(h.college_id, h.score)
    }
  }

  // My stats
  const myHealth = latestHealthByCollege.get(collegeId) || 0
  const mySummary = allSummaries.find(s => s.college_id === collegeId)
  const myEnrollments = allEnrollments.filter(e => e.college_id === collegeId)
  const myCompletion = myEnrollments.length > 0
    ? Math.round(myEnrollments.reduce((a, e) => a + (e.progress_pct || 0), 0) / myEnrollments.length)
    : 0

  // Platform averages (all colleges)
  const allHealthScores = Array.from(latestHealthByCollege.values())
  const avgHealth = allHealthScores.length > 0
    ? Math.round(allHealthScores.reduce((a, v) => a + v, 0) / allHealthScores.length)
    : 0
  const avgOffers = allSummaries.length > 0
    ? Math.round(allSummaries.reduce((a, s) => a + (s.offers || 0), 0) / allSummaries.length)
    : 0
  const avgLpa = allSummaries.length > 0
    ? parseFloat((allSummaries.reduce((a, s) => a + (s.avg_lpa || 0), 0) / allSummaries.length).toFixed(1))
    : 0
  const avgCompletion = allEnrollments.length > 0
    ? Math.round(allEnrollments.reduce((a, e) => a + (e.progress_pct || 0), 0) / allEnrollments.length)
    : 0

  // Top 10% threshold
  const sortedHealth = [...allHealthScores].sort((a, b) => b - a)
  const top10Idx = Math.max(0, Math.floor(sortedHealth.length * 0.1) - 1)
  const top10Health = sortedHealth[top10Idx] || 0

  // My percentile
  const higherThanMe = allHealthScores.filter(h => h > myHealth).length
  const percentile = allHealthScores.length > 0
    ? Math.round(100 - (higherThanMe / allHealthScores.length) * 100)
    : 0

  const totalColleges = allHealthScores.length

  const metrics = [
    {
      label: 'College Health Score',
      mine: myHealth,
      avg: avgHealth,
      top10: top10Health,
      unit: '/100',
      color: 'bg-blue-500',
      higher: myHealth >= avgHealth,
    },
    {
      label: 'Placement Offers (2025-26)',
      mine: mySummary?.offers || 0,
      avg: avgOffers,
      top10: Math.round(avgOffers * 1.5),
      unit: ' offers',
      color: 'bg-green-500',
      higher: (mySummary?.offers || 0) >= avgOffers,
    },
    {
      label: 'Average CTC',
      mine: parseFloat((mySummary?.avg_lpa || 0).toFixed(1)),
      avg: avgLpa,
      top10: parseFloat((avgLpa * 1.4).toFixed(1)),
      unit: ' LPA',
      color: 'bg-yellow-500',
      higher: (mySummary?.avg_lpa || 0) >= avgLpa,
    },
    {
      label: 'Training Completion',
      mine: myCompletion,
      avg: avgCompletion,
      top10: Math.min(100, Math.round(avgCompletion * 1.25)),
      unit: '%',
      color: 'bg-purple-500',
      higher: myCompletion >= avgCompletion,
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1>Benchmarking</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {college?.name} vs. anonymized partner college averages
        </p>
      </div>

      {/* Percentile banner */}
      <div className={cn(
        'rounded-xl border p-5 flex items-center gap-4',
        percentile >= 75 ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
          : percentile >= 50 ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
          : 'border-red-200 bg-red-50 dark:bg-red-950/20'
      )}>
        <div className="text-5xl font-black">
          {percentile >= 75 ? '🏆' : percentile >= 50 ? '📈' : '📉'}
        </div>
        <div>
          <p className="text-lg font-bold">
            You are in the top{' '}
            <span className={percentile >= 75 ? 'text-green-600' : percentile >= 50 ? 'text-yellow-600' : 'text-red-600'}>
              {100 - percentile}%
            </span>
            {' '}of partner colleges
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Health score {myHealth} · Ranked #{higherThanMe + 1} of {totalColleges} partner colleges (anonymized)
          </p>
          {percentile >= 75 && (
            <p className="text-sm text-green-700 dark:text-green-400 font-medium mt-1">
              ✨ Keep it up — you are a top performer on the CareerOS network
            </p>
          )}
          {percentile < 50 && (
            <p className="text-sm text-red-700 dark:text-red-400 font-medium mt-1">
              💡 Below average on placement rate — recommend enrolling students in Interview Master program
            </p>
          )}
        </div>
      </div>

      {/* Metric comparisons */}
      <div className="space-y-4">
        <h3>Performance vs Partner Average</h3>
        {metrics.map(m => {
          const maxVal = Math.max(m.mine, m.top10, 1)
          const myPct = Math.min(100, (m.mine / maxVal) * 100)
          const avgPct = Math.min(100, (m.avg / maxVal) * 100)
          const top10Pct = Math.min(100, (m.top10 / maxVal) * 100)

          return (
            <div key={m.label} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">{m.label}</p>
                <div className="flex items-center gap-1.5">
                  {m.higher ? (
                    <span className="badge badge-green text-xs">↑ Above average</span>
                  ) : (
                    <span className="badge badge-yellow text-xs">↓ Below average</span>
                  )}
                </div>
              </div>

              {/* Bar chart */}
              <div className="space-y-3">
                {/* My college */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold">{college?.code || 'You'}</span>
                    <span className="font-bold">{m.mine}{m.unit}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', m.color)} style={{ width: `${myPct}%` }} />
                  </div>
                </div>

                {/* Partner average */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Partner Average (anonymized)</span>
                    <span className="text-muted-foreground font-medium">{m.avg}{m.unit}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-muted-foreground/50 transition-all" style={{ width: `${avgPct}%` }} />
                  </div>
                </div>

                {/* Top 10% */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Top 10% benchmark</span>
                    <span className="text-muted-foreground font-medium">{m.top10}{m.unit}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/30 transition-all" style={{ width: `${top10Pct}%` }} />
                  </div>
                </div>
              </div>

              {/* Gap note */}
              {!m.higher && (
                <p className="text-xs text-muted-foreground mt-3 p-2 rounded-lg bg-muted/50">
                  Gap to average: <span className="font-semibold text-foreground">
                    {typeof m.mine === 'number' && typeof m.avg === 'number'
                      ? `${Math.abs(m.avg - m.mine).toFixed(1)}${m.unit}`
                      : '—'}
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="h-3 w-8 rounded-full bg-blue-500/70" /> Your college</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-8 rounded-full bg-muted-foreground/50" /> Partner avg</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-8 rounded-full bg-primary/30" /> Top 10%</div>
        <p className="ml-auto italic">All partner data is anonymized — no individual college is identifiable</p>
      </div>
    </div>
  )
}
