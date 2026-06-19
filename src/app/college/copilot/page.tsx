import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import CopilotChat from './CopilotChat'

export const dynamic = 'force-dynamic'

export default async function CopilotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('college_id, name')
    .eq('auth_id', user.id)
    .single()

  if (!profile?.college_id) redirect('/college/dashboard')

  const svc = createServiceClient()
  const collegeId = profile.college_id

  // Fetch college info
  const { data: college } = await svc
    .from('colleges')
    .select('id, name, code, city, state, status')
    .eq('id', collegeId)
    .single()

  // Students
  const { data: students } = await svc
    .from('students')
    .select('id, name, cgpa, readiness_score, risk_level, placement_status, batch_year')
    .eq('college_id', collegeId)

  // Enrollments
  const { data: enrollments } = await svc
    .from('enrollments')
    .select('student_id, cohort_id, progress_pct, completed')
    .eq('college_id', collegeId)

  // Cohorts
  const { data: cohorts } = await svc
    .from('cohorts')
    .select('id, name, program_type, start_date, end_date')

  // Placements
  const { data: placements } = await svc
    .from('placements')
    .select('id, company, role, package_lpa, placed_at, status')
    .eq('college_id', collegeId)

  // FDP sessions
  const { data: fdpSessions } = await svc
    .from('fdp_sessions')
    .select('id, title, date, status, mode')
    .eq('college_id', collegeId)
    .order('date', { ascending: false })

  // MOU
  const { data: mou } = await svc
    .from('mous')
    .select('status, expiry_date, seats, revenue_share_pct')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Year summary
  const { data: yearSummary } = await svc
    .from('year_summaries')
    .select('offers, avg_lpa, academic_year')
    .eq('college_id', collegeId)
    .eq('academic_year', '2025-26')
    .single()

  // Health history
  const { data: healthHistory } = await svc
    .from('college_health_history')
    .select('score, captured_at')
    .eq('college_id', collegeId)
    .order('captured_at', { ascending: false })
    .limit(1)

  // ── Compute AI insights ────────────────────────────────────────────────────
  const allStudents = students || []
  const allEnrollments = enrollments || []
  const allPlacements = placements || []
  const allFDP = fdpSessions || []

  const totalStudents = allStudents.length
  const highRisk = allStudents.filter(s => s.risk_level === 'high')
  const medRisk = allStudents.filter(s => s.risk_level === 'medium')
  const placed = allStudents.filter(s => s.placement_status === 'placed')
  const avgReadiness = totalStudents > 0
    ? Math.round(allStudents.reduce((a, s) => a + (s.readiness_score || 0), 0) / totalStudents)
    : 0
  const avgCGPA = totalStudents > 0
    ? (allStudents.reduce((a, s) => a + (s.cgpa || 0), 0) / totalStudents).toFixed(2)
    : '0'
  const placementRate = totalStudents > 0
    ? Math.round((placed.length / totalStudents) * 100)
    : 0

  // Enrollment completion
  const avgCompletion = allEnrollments.length > 0
    ? Math.round(allEnrollments.reduce((a, e) => a + (e.progress_pct || 0), 0) / allEnrollments.length)
    : 0
  const completedEnrollments = allEnrollments.filter(e => e.completed).length

  // Students not yet enrolled in any program
  const enrolledStudentIds = new Set(allEnrollments.map(e => e.student_id))
  const notEnrolled = allStudents.filter(s => !enrolledStudentIds.has(s.id))

  // Upcoming FDP
  const today = new Date()
  const upcomingFDP = allFDP.filter(f =>
    f.status === 'scheduled' && new Date(f.date) >= today
  )
  const recentPlacements = allPlacements
    .filter(p => p.status === 'confirmed')
    .sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime())
    .slice(0, 5)

  const healthScore = healthHistory?.[0]?.score || 0
  const mouExpiry = mou?.expiry_date ? new Date(mou.expiry_date) : null
  const mouDaysLeft = mouExpiry
    ? Math.ceil((mouExpiry.getTime() - today.getTime()) / 86400000)
    : null

  // Build context string for AI
  const ctx = {
    college: college?.name || 'Your College',
    code: college?.code || '',
    totalStudents,
    highRisk: highRisk.length,
    medRisk: medRisk.length,
    placed: placed.length,
    placementRate,
    avgReadiness,
    avgCGPA,
    avgCompletion,
    completedEnrollments,
    notEnrolled: notEnrolled.length,
    upcomingFDP: upcomingFDP.length,
    healthScore,
    mouDaysLeft,
    avgLPA: yearSummary?.avg_lpa || 0,
    offers: yearSummary?.offers || 0,
    recentCompanies: recentPlacements.slice(0, 3).map(p => p.company).join(', '),
  }

  // ── Generate AI briefing ───────────────────────────────────────────────────
  const insights = generateInsights(ctx)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xl shadow-lg">
            🤖
          </div>
          <div>
            <h1 className="text-xl font-bold">TPO Copilot</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI assistant for {college?.name} · {college?.code}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-xs text-muted-foreground">AI Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">

          {/* Snapshot cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Health Score', value: `${healthScore}/100`, color: healthScore >= 70 ? 'text-green-600' : healthScore >= 50 ? 'text-yellow-600' : 'text-red-600', sub: healthScore >= 70 ? 'Healthy' : healthScore >= 50 ? 'Needs Attention' : 'Critical' },
              { label: 'Avg Readiness', value: `${avgReadiness}%`, color: avgReadiness >= 70 ? 'text-green-600' : avgReadiness >= 50 ? 'text-yellow-600' : 'text-red-600', sub: `${totalStudents} students` },
              { label: 'Placement Rate', value: `${placementRate}%`, color: placementRate >= 60 ? 'text-green-600' : 'text-yellow-600', sub: `${placed.length} placed` },
              { label: 'High Risk', value: String(highRisk.length), color: highRisk.length > 0 ? 'text-red-600' : 'text-green-600', sub: 'need intervention' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <p className="stat-label">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* AI Insights panel */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b bg-gradient-to-r from-purple-500/5 to-blue-500/5 flex items-center gap-2">
              <span className="text-lg">✨</span>
              <div>
                <h3 className="font-semibold">AI Daily Briefing</h3>
                <p className="text-xs text-muted-foreground">Generated for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {insights.map((ins, i) => (
                <div key={i} className={`flex gap-3 p-4 rounded-xl border ${ins.bg}`}>
                  <span className="text-xl shrink-0">{ins.icon}</span>
                  <div>
                    <p className="font-semibold text-sm mb-1">{ins.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ins.body}</p>
                    {ins.action && (
                      <p className="text-xs font-medium mt-2 text-blue-600">→ {ins.action}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High-risk students list */}
          {highRisk.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <h3 className="font-semibold">High-Risk Students — Immediate Attention</h3>
                <span className="ml-auto text-xs text-red-600 font-semibold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                  {highRisk.length} students
                </span>
              </div>
              <div className="p-5">
                <div className="space-y-2">
                  {highRisk.slice(0, 8).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">Batch {s.batch_year} · CGPA {s.cgpa?.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Readiness</p>
                          <p className="text-sm font-bold text-red-600">{s.readiness_score}%</p>
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                          High Risk
                        </span>
                      </div>
                    </div>
                  ))}
                  {highRisk.length > 8 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{highRisk.length - 8} more high-risk students
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent placements */}
          {recentPlacements.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <h3 className="font-semibold">Recent Placements</h3>
              </div>
              <div className="p-5">
                <div className="space-y-2">
                  {recentPlacements.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.company}</p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                      <span className="text-sm font-bold text-green-600">₹{p.package_lpa}L</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Q&A */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <span className="text-lg">💬</span>
              <h3 className="font-semibold">Ask Copilot</h3>
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">AI Powered</span>
            </div>
            <CopilotChat context={ctx} />
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Rule-based AI insight generation ─────────────────────────────────────── */
interface CollegeCtx {
  college: string
  code: string
  totalStudents: number
  highRisk: number
  medRisk: number
  placed: number
  placementRate: number
  avgReadiness: number
  avgCGPA: string
  avgCompletion: number
  completedEnrollments: number
  notEnrolled: number
  upcomingFDP: number
  healthScore: number
  mouDaysLeft: number | null
  avgLPA: number
  offers: number
  recentCompanies: string
}

interface Insight {
  icon: string
  title: string
  body: string
  action?: string
  bg: string
}

function generateInsights(ctx: CollegeCtx): Insight[] {
  const insights: Insight[] = []

  // Overall health
  if (ctx.healthScore >= 75) {
    insights.push({
      icon: '🏆',
      title: `${ctx.college} is performing well`,
      body: `College Health Score is ${ctx.healthScore}/100 — in the top tier. Placement rate stands at ${ctx.placementRate}% with an average readiness of ${ctx.avgReadiness}%. Keep up the momentum.`,
      bg: 'border-green-100 bg-green-50',
    })
  } else if (ctx.healthScore >= 50) {
    insights.push({
      icon: '📈',
      title: 'Health score needs improvement',
      body: `Current Health Score is ${ctx.healthScore}/100. Key levers: improve training completion (currently ${ctx.avgCompletion}%), reduce high-risk student count (${ctx.highRisk}), and drive more placements.`,
      action: 'Focus on high-risk interventions this week',
      bg: 'border-yellow-100 bg-yellow-50',
    })
  } else if (ctx.healthScore > 0) {
    insights.push({
      icon: '🚨',
      title: 'Critical: Health score below 50',
      body: `Health Score is ${ctx.healthScore}/100 — this needs urgent action. ${ctx.highRisk} high-risk students, ${ctx.placementRate}% placement rate. Consider emergency training bootcamp and direct student interventions.`,
      action: 'Schedule urgent TPO review meeting',
      bg: 'border-red-100 bg-red-50',
    })
  }

  // High-risk students
  if (ctx.highRisk > 0) {
    insights.push({
      icon: '⚠️',
      title: `${ctx.highRisk} students need immediate intervention`,
      body: `${ctx.highRisk} high-risk students have low readiness scores (typically CGPA < 7.0 or poor training progress). These students are at risk of missing placement season. Schedule 1:1 counseling sessions and enroll them in intensive training.`,
      action: `Contact ${ctx.highRisk} high-risk students this week`,
      bg: 'border-red-100 bg-red-50',
    })
  } else if (ctx.medRisk > 0) {
    insights.push({
      icon: '🟡',
      title: `${ctx.medRisk} students in medium-risk zone`,
      body: `${ctx.medRisk} students have medium placement risk. With targeted intervention — aptitude coaching, mock interviews, and resume reviews — most can move to low-risk before the placement season.`,
      action: 'Schedule aptitude workshop for medium-risk batch',
      bg: 'border-yellow-100 bg-yellow-50',
    })
  } else if (ctx.totalStudents > 0) {
    insights.push({
      icon: '✅',
      title: 'All students in low-risk zone',
      body: `No high or medium risk students detected. Average readiness is ${ctx.avgReadiness}% and CGPA is ${ctx.avgCGPA}. Continue current training cadence.`,
      bg: 'border-green-100 bg-green-50',
    })
  }

  // Training completion
  if (ctx.notEnrolled > 0) {
    insights.push({
      icon: '📚',
      title: `${ctx.notEnrolled} students not enrolled in any program`,
      body: `${ctx.notEnrolled} students have not enrolled in CRT, DSA, or any other training program. Training completion is one of the top factors in placement readiness. Enroll them in the next available cohort.`,
      action: 'Enroll unenrolled students in next CRT cohort',
      bg: 'border-orange-100 bg-orange-50',
    })
  } else if (ctx.avgCompletion < 60) {
    insights.push({
      icon: '📉',
      title: `Training completion low at ${ctx.avgCompletion}%`,
      body: `Average program completion is ${ctx.avgCompletion}%. Students completing less than 50% of training are 2x more likely to miss placements. Consider mandatory attendance tracking and weekly progress check-ins.`,
      action: 'Send progress reminder to all enrolled students',
      bg: 'border-orange-100 bg-orange-50',
    })
  } else {
    insights.push({
      icon: '📚',
      title: `Training on track — ${ctx.avgCompletion}% average completion`,
      body: `${ctx.completedEnrollments} enrollments completed. Average completion at ${ctx.avgCompletion}% is solid. Focus on students below 40% completion to prevent last-minute drop-offs.`,
      bg: 'border-blue-100 bg-blue-50',
    })
  }

  // MOU status
  if (ctx.mouDaysLeft !== null && ctx.mouDaysLeft <= 60 && ctx.mouDaysLeft > 0) {
    insights.push({
      icon: '📄',
      title: `MOU expiring in ${ctx.mouDaysLeft} days — renew now`,
      body: `Your MOU with Skill Tank expires in ${ctx.mouDaysLeft} days. An expired MOU blocks new student enrollments and pauses revenue sharing. Contact the admin team to initiate renewal today.`,
      action: 'Contact admin: mou@skilltank.in',
      bg: 'border-red-100 bg-red-50',
    })
  } else if (ctx.mouDaysLeft !== null && ctx.mouDaysLeft > 60) {
    insights.push({
      icon: '✅',
      title: `MOU active — ${ctx.mouDaysLeft} days remaining`,
      body: `Your partnership agreement is in good standing with ${ctx.mouDaysLeft} days until expiry. No action needed at this time.`,
      bg: 'border-green-100 bg-green-50',
    })
  }

  // Upcoming FDP
  if (ctx.upcomingFDP > 0) {
    insights.push({
      icon: '🎓',
      title: `${ctx.upcomingFDP} FDP session${ctx.upcomingFDP > 1 ? 's' : ''} coming up`,
      body: `You have ${ctx.upcomingFDP} upcoming Faculty Development Programme session${ctx.upcomingFDP > 1 ? 's' : ''}. Ensure maximum faculty participation — FDP activity contributes to the College Health Score.`,
      action: 'Share FDP schedule with department heads',
      bg: 'border-purple-100 bg-purple-50',
    })
  }

  // Placement performance
  if (ctx.avgLPA > 0) {
    const performance = ctx.avgLPA >= 8 ? 'excellent' : ctx.avgLPA >= 6 ? 'good' : 'below average'
    insights.push({
      icon: '💰',
      title: `Average package ₹${ctx.avgLPA.toFixed(1)}L — ${performance}`,
      body: `${ctx.offers} offers secured this year at ₹${ctx.avgLPA.toFixed(1)}L average. ${ctx.recentCompanies ? `Recent companies: ${ctx.recentCompanies}.` : ''} ${ctx.avgLPA >= 8 ? 'Platform average is ₹7.2L — you\'re outperforming.' : 'Target higher-package companies for the next drive.'}`,
      bg: ctx.avgLPA >= 8 ? 'border-green-100 bg-green-50' : 'border-blue-100 bg-blue-50',
    })
  }

  return insights.slice(0, 6) // cap at 6 insights
}
