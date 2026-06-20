import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getStatusBadge, cn } from '@/lib/utils'
import { predictPlacement } from '@/lib/ai/score'
import Link from 'next/link'
import {
  User, GraduationCap, TrendingUp, Brain, AlertTriangle,
  CheckCircle, ArrowLeft, BookOpen, Award, Video
} from 'lucide-react'
import { ATSAnalyzer } from '@/app/college/students/[id]/ATSAnalyzer'

export const dynamic = 'force-dynamic'

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right">{value}</span>
    </div>
  )
}

function ProbRing({ value }: { value: number }) {
  const r = 44, cx = 52, cy = 52
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#eab308' : '#ef4444'
  return (
    <svg width={104} height={104}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={9} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 3} textAnchor="middle" fontWeight={700} fontSize={20} fill={color}>{value}%</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={9} fill="#94a3b8">Placement</text>
    </svg>
  )
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { id } = params

  const [{ data: student }, { data: enrollments }, { data: activity }] = await Promise.all([
    supabase.from('students')
      .select('*, colleges(name, code, city), departments(name)')
      .eq('id', id)
      .single(),
    supabase.from('enrollments')
      .select('progress_pct, status, cohorts(name, status)')
      .eq('student_id', id)
      .limit(8),
    supabase.from('activity_events')
      .select('event_type, title, created_at')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!student) notFound()

  const avgTraining = enrollments?.length
    ? Math.round(enrollments.reduce((a, e) => a + (e.progress_pct || 0), 0) / enrollments.length)
    : 50

  const cgpa = Number(student.cgpa) || 7.5
  const prediction = predictPlacement({
    attendancePct: Math.min(100, student.readiness_score || 70),
    trainingCompletionPct: avgTraining,
    assessmentScore: Math.min(100, student.ats_score || 0),
    dsaOrMockScore: Math.min(100, Math.round(cgpa * 9)),
    cgpa,
  })

  const college = student.colleges as any
  const dept = student.departments as any

  const riskColor = student.risk_level === 'high' ? 'text-red-600 bg-red-50 border-red-200'
    : student.risk_level === 'medium' ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
    : 'text-green-600 bg-green-50 border-green-200'

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/admin/students" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="h-3.5 w-3.5" /> All Students
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{student.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{student.email}</span>
            {student.phone && <span className="text-sm text-muted-foreground">· {student.phone}</span>}
            {student.roll_no && <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{student.roll_no}</span>}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-semibold text-primary">{college?.code}</span>
            {dept && <span className="text-xs text-muted-foreground">{dept.name}</span>}
            <span className="text-xs text-muted-foreground">Batch {student.batch_year}</span>
            <span className={getStatusBadge(student.placement_status)}>{student.placement_status?.replace('_', ' ')}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${riskColor}`}>{student.risk_level} risk</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'CGPA', value: cgpa.toFixed(2), sub: 'out of 10', icon: GraduationCap, color: 'text-blue-600' },
          { label: 'Readiness', value: `${student.readiness_score || 0}%`, sub: 'placement readiness', icon: TrendingUp, color: 'text-green-600' },
          { label: 'ATS Score', value: student.ats_score || '—', sub: 'resume strength', icon: Award, color: 'text-indigo-600' },
          { label: 'Training', value: `${avgTraining}%`, sub: 'avg completion', icon: BookOpen, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="stat-label">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Placement Prediction */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Placement Prediction</h3>
          </div>
          <div className="flex items-center gap-5 mb-5">
            <ProbRing value={prediction.probability} />
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Expected Package</p>
                <p className="text-xl font-bold text-green-600">₹{prediction.expectedPackageLPA}L</p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${riskColor}`}>
                {student.risk_level === 'low'
                  ? <CheckCircle className="h-3.5 w-3.5" />
                  : <AlertTriangle className="h-3.5 w-3.5" />
                }
                {student.risk_level === 'low' ? 'Low Risk — Likely to place' : student.risk_level === 'medium' ? 'Medium Risk — Needs focus' : 'High Risk — Intervention needed'}
              </div>
            </div>
          </div>

          {/* Factor bars */}
          <div className="space-y-2.5">
            {prediction.breakdown.map((f, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{f.label}</span>
                  <span className="text-muted-foreground">{f.detail} · {Math.round(f.weight * 100)}% wt.</span>
                </div>
                <ScoreBar
                  value={f.value}
                  color={f.value >= 70 ? 'bg-green-500' : f.value >= 40 ? 'bg-yellow-500' : 'bg-red-500'}
                />
              </div>
            ))}
          </div>

          {/* Skill recommendations */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Recommended Focus Areas</p>
            <div className="flex flex-wrap gap-1.5">
              {prediction.recommendedSkills.map(s => (
                <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Training enrollments */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-600" /> Training Progress
          </h3>
          {(enrollments?.length || 0) > 0 ? (
            <div className="space-y-3">
              {enrollments?.map((e, i) => {
                const cohort = e.cohorts as any
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{cohort?.name || 'Cohort'}</span>
                      <span className={cn('font-semibold', e.progress_pct >= 80 ? 'text-green-600' : e.progress_pct >= 50 ? 'text-yellow-600' : 'text-red-600')}>
                        {e.progress_pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', e.progress_pct >= 80 ? 'bg-green-500' : e.progress_pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
                        style={{ width: `${e.progress_pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No training enrollments found.</p>
          )}

          {/* Skills */}
          {student.skills?.length > 0 && (
            <div className="mt-5 pt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Skills on Record</p>
              <div className="flex flex-wrap gap-1.5">
                {student.skills.map((sk: string) => (
                  <span key={sk} className="text-xs border rounded-full px-2 py-0.5">{sk}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Mock Interview — discoverable from admin */}
      <div className="rounded-xl border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-800 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Video className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400">AI Mock Interview</h3>
          <span className="text-[10px] bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 px-1.5 py-0.5 rounded-full">Powered by LiveAvatar</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Live AI interviewer with real-time feedback — results feed into the CareerOS readiness score.</p>
        <a href="https://embed.liveavatar.com/v1/6bb399fb-fc3c-4e1a-893e-5c4a2de11988?orientation=horizontal" target="_blank" rel="noopener"
          className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors">
          <Video className="h-3.5 w-3.5" /> Launch AI Mock Interview
        </a>
      </div>

      {/* ATS Resume Analyzer — discoverable from admin */}
      <ATSAnalyzer studentId={student.id} cgpa={cgpa} />
    </div>
  )
}
