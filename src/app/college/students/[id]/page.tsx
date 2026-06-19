import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { cn, formatDate, getStatusBadge } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const EVENT_ICONS: Record<string, string> = {
  'student.enrolled': '📚',
  'student.placed': '🎉',
  'placement.offered': '🎉',
  'placement.accepted': '✅',
  'assessment.completed': '📝',
  'fdp.attended': '🎓',
  'report.generated': '📄',
  'cohort.completed': '🏆',
  'training.started': '▶️',
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  const [studentRes, enrollmentsRes, activityRes] = await Promise.all([
    supabase.from('students')
      .select('*, departments(name)')
      .eq('id', params.id)
      .eq('college_id', collegeId)
      .single(),
    supabase.from('enrollments')
      .select('*, cohorts(name, status, batch_label, start_date, end_date), programs(name)')
      .eq('student_id', params.id)
      .order('enrolled_at', { ascending: false }),
    supabase.from('activity_events')
      .select('*')
      .eq('entity_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const s = studentRes.data
  if (!s) notFound()

  const enrollments = enrollmentsRes.data || []
  const events = activityRes.data || []

  const readinessColor = (s.readiness_score || 0) >= 70
    ? 'text-green-600' : (s.readiness_score || 0) >= 40
    ? 'text-yellow-600' : 'text-red-600'

  const atsColor = (s.ats_score || 0) >= 70 ? 'text-green-600' : (s.ats_score || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'

  const riskBadge = s.risk_level === 'high' ? 'badge badge-red' : s.risk_level === 'medium' ? 'badge badge-yellow' : 'badge badge-green'

  const profileStrength = Math.min(100, Math.round(
    ((s.skills as string[])?.length || 0) * 7 +
    (s.cgpa || 0) * 8 +
    (s.ats_score || 0) * 0.2 +
    (s.readiness_score || 0) * 0.1
  ))

  const riskNumeric = s.risk_level === 'low' ? 18 : s.risk_level === 'medium' ? 52 : 88

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/college/students" className="hover:text-primary transition-colors">Students</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{s.name}</span>
      </div>

      {/* Student header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {s.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{s.name}</h1>
              <span className={riskBadge}>{s.risk_level} risk</span>
              <span className={cn('badge', getStatusBadge(s.placement_status))}>{s.placement_status?.replace('_', ' ')}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{s.email} · {s.roll_no}</p>
            <div className="flex flex-wrap items-center gap-6 mt-3">
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{(s.departments as any)?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Batch</p>
                <p className="text-sm font-medium">{s.batch_year}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CGPA</p>
                <p className="text-sm font-bold">{s.cgpa?.toFixed(2) || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{s.phone || '—'}</p>
              </div>
            </div>
          </div>

          {/* Score badges */}
          <div className="hidden sm:flex gap-6 shrink-0">
            <div className="text-center">
              <p className={cn('text-3xl font-bold', readinessColor)}>{s.readiness_score || 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">Readiness</p>
            </div>
            <div className="text-center">
              <p className={cn('text-3xl font-bold', atsColor)}>{s.ats_score || '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">ATS Score</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        {((s.skills as string[])?.length > 0) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {(s.skills as string[]).map((skill: string) => (
                <span key={skill} className="badge badge-blue text-xs">{skill}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Programs + AI Scores */}
        <div className="lg:col-span-2 space-y-5">
          {/* Training Programs */}
          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b">
              <h3>Training Programs & Progress</h3>
              <p className="text-xs text-muted-foreground mt-1">{enrollments.length} enrollment{enrollments.length !== 1 ? 's' : ''}</p>
            </div>
            {enrollments.length > 0 ? (
              <div className="divide-y">
                {enrollments.map(e => (
                  <div key={e.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{(e.cohorts as any)?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(e.programs as any)?.name}
                          {(e.cohorts as any)?.batch_label && ` · ${(e.cohorts as any).batch_label}`}
                        </p>
                      </div>
                      <span className={cn('badge text-xs shrink-0', getStatusBadge((e.cohorts as any)?.status))}>
                        {(e.cohorts as any)?.status}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-semibold">{e.progress_pct || 0}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${e.progress_pct || 0}%` }}
                        />
                      </div>
                    </div>
                    {e.grade && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Grade: <span className="font-semibold text-foreground">{e.grade}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Not enrolled in any programs yet
              </p>
            )}
          </div>

          {/* CareerOS AI Scores */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3>CareerOS AI Scores</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI Powered</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Placement Readiness', value: s.readiness_score || 0, color: 'bg-blue-500', textColor: 'text-blue-600' },
                { label: 'ATS Compatibility', value: s.ats_score || 0, color: 'bg-green-500', textColor: 'text-green-600' },
                { label: 'At-Risk Signal', value: riskNumeric, color: 'bg-red-500', textColor: 'text-red-600' },
                { label: 'Profile Strength', value: profileStrength, color: 'bg-purple-500', textColor: 'text-purple-600' },
              ].map(score => (
                <div key={score.label} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">{score.label}</span>
                    <span className={cn('text-sm font-bold', score.textColor)}>{score.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', score.color)}
                      style={{ width: `${score.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendation */}
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-primary mb-1">🤖 AI Recommendation</p>
              <p className="text-xs text-muted-foreground">
                {s.risk_level === 'high'
                  ? `High risk student — immediate intervention needed. Schedule mock interviews and enroll in Interview Master program.`
                  : (s.readiness_score || 0) < 60
                  ? `Readiness score below 60% — recommend enrolling in aptitude + communication training cohort.`
                  : (s.placement_status === 'unplaced' && (s.readiness_score || 0) >= 70)
                  ? `Strong readiness score. Focus on company applications and resume optimization.`
                  : `Student is on track. Continue current training trajectory.`}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Placement Journey Timeline */}
        <div className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b">
            <h3>Placement Journey</h3>
            <p className="text-xs text-muted-foreground mt-1">Activity timeline</p>
          </div>
          <div className="px-5 py-5">
            {events.length > 0 ? (
              <ol className="relative border-l-2 border-muted ml-2 space-y-5">
                {events.map((ev, idx) => (
                  <li key={ev.id} className="ml-5">
                    <div className="absolute -left-[9px] h-4 w-4 rounded-full bg-primary ring-4 ring-background flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      {EVENT_ICONS[ev.event_type] || '🔔'}{' '}
                      {ev.event_type?.replace(/\./g, ' · ')}
                    </p>
                    {ev.payload?.note && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ev.payload.note}</p>
                    )}
                    {ev.payload?.company && (
                      <p className="text-xs font-medium text-primary mt-0.5">@ {ev.payload.company}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(ev.created_at)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">Events appear here as student progresses</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
