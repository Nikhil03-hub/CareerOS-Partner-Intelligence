import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn, getStatusBadge } from '@/lib/utils'
import { BookOpen, Users, CheckCircle, AlertTriangle, TrendingUp, Target } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProgramsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  // Fetch seat allocations with program info
  const [allocationsRes, cohortsRes, allProgramsRes] = await Promise.all([
    supabase.from('seat_allocations')
      .select('*, programs(id, name, code, type, duration_weeks, modules_count)')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false }),
    supabase.from('cohorts')
      .select('id, name, status, enrolled_count, completion_pct, program_id, programs(name, code, type)')
      .eq('college_id', collegeId)
      .order('start_date', { ascending: false }),
    supabase.from('programs').select('id, name, code, type, duration_weeks, modules_count'),
  ])

  const allocations = allocationsRes.data || []
  const cohorts = cohortsRes.data || []
  const allPrograms = allProgramsRes.data || []

  // Aggregate enrollment counts per program from cohorts
  const enrollmentByProgram: Record<string, number> = {}
  cohorts.forEach(c => {
    if (c.program_id) {
      enrollmentByProgram[c.program_id] = (enrollmentByProgram[c.program_id] || 0) + (c.enrolled_count || 0)
    }
  })

  // Build program cards: merge seat_allocations + programs that have cohorts
  const programMap = new Map<string, {
    id: string; name: string; code: string; type: string;
    duration_weeks?: number; modules_count?: number;
    seats_purchased: number; seats_used: number;
    cohortCount: number; completedCohorts: number;
    avgCompletion: number;
  }>()

  // From seat_allocations
  allocations.forEach(a => {
    const p = a.programs as any
    if (!p) return
    programMap.set(p.id, {
      id: p.id, name: p.name, code: p.code, type: p.type,
      duration_weeks: p.duration_weeks, modules_count: p.modules_count,
      seats_purchased: (programMap.get(p.id)?.seats_purchased || 0) + (a.seats_purchased || 0),
      seats_used: (programMap.get(p.id)?.seats_used || 0) + (a.seats_used || 0),
      cohortCount: 0, completedCohorts: 0, avgCompletion: 0,
    })
  })

  // Add cohort-based programs that may not have seat allocations
  cohorts.forEach(c => {
    const p = c.programs as any
    if (!p) return
    if (!programMap.has(c.program_id!)) {
      programMap.set(c.program_id!, {
        id: c.program_id!, name: p.name, code: p.code, type: p.type,
        seats_purchased: 0, seats_used: 0,
        cohortCount: 0, completedCohorts: 0, avgCompletion: 0,
      })
    }
  })

  // Enrich with cohort stats
  cohorts.forEach(c => {
    if (!c.program_id || !programMap.has(c.program_id)) return
    const entry = programMap.get(c.program_id)!
    entry.cohortCount++
    if (c.status === 'completed') entry.completedCohorts++
    entry.avgCompletion = Math.round(
      (entry.avgCompletion * (entry.cohortCount - 1) + (c.completion_pct || 0)) / entry.cohortCount
    )
    // Use actual enrollments if no seat allocation
    if (entry.seats_purchased === 0) {
      entry.seats_used = enrollmentByProgram[c.program_id] || 0
      entry.seats_purchased = Math.max(entry.seats_used, 100) // default
    }
  })

  const programs = Array.from(programMap.values())
  const totalSeats = programs.reduce((s, p) => s + p.seats_purchased, 0)
  const totalUsed = programs.reduce((s, p) => s + p.seats_used, 0)
  const utilizationPct = totalSeats > 0 ? Math.round((totalUsed / totalSeats) * 100) : 0

  const TYPE_COLOR: Record<string, string> = {
    'CRT': 'bg-blue-100 text-blue-700',
    'Interview Master': 'bg-violet-100 text-violet-700',
    'FDP': 'bg-green-100 text-green-700',
    'DSA': 'bg-orange-100 text-orange-700',
    'Aptitude': 'bg-yellow-100 text-yellow-700',
    'AI/ML': 'bg-pink-100 text-pink-700',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Programs & Seat Tracking</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track purchased seats, utilization, and cohort progress per program
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Total Programs</p>
          <p className="stat-value">{programs.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Seats Purchased</p>
          <p className="stat-value">{totalSeats.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Seats Utilized</p>
          <p className="stat-value text-primary">{totalUsed.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Utilization Rate</p>
          <p className={cn('stat-value', utilizationPct >= 80 ? 'text-green-600' : utilizationPct >= 50 ? 'text-yellow-600' : 'text-red-500')}>
            {utilizationPct}%
          </p>
        </div>
      </div>

      {/* Programs Grid */}
      {programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {programs.map(prog => {
            const remaining = prog.seats_purchased - prog.seats_used
            const utilPct = prog.seats_purchased > 0
              ? Math.min(100, Math.round((prog.seats_used / prog.seats_purchased) * 100))
              : 0
            const isLow = remaining <= 10 && prog.seats_purchased > 0
            const isFull = prog.seats_used >= prog.seats_purchased && prog.seats_purchased > 0

            return (
              <div key={prog.id} className="rounded-xl border bg-card p-5 space-y-4">
                {/* Program header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">{prog.name}</p>
                      <p className="text-xs text-muted-foreground">{prog.code}</p>
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full shrink-0',
                    TYPE_COLOR[prog.type] || 'bg-muted text-muted-foreground'
                  )}>
                    {prog.type}
                  </span>
                </div>

                {/* Seat allocation */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Seat Utilization</span>
                    <span className={cn('font-semibold', utilPct >= 90 ? 'text-red-600' : utilPct >= 70 ? 'text-yellow-600' : 'text-green-600')}>
                      {utilPct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all',
                        utilPct >= 90 ? 'bg-red-500' : utilPct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      style={{ width: `${utilPct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">Purchased</p>
                      <p className="text-sm font-bold">{prog.seats_purchased}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">Used</p>
                      <p className="text-sm font-bold text-primary">{prog.seats_used}</p>
                    </div>
                    <div className={cn('text-center p-2 rounded-lg',
                      isLow ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted/40'
                    )}>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className={cn('text-sm font-bold', isLow ? 'text-red-600' : 'text-green-600')}>
                        {Math.max(0, remaining)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {isFull && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700 dark:text-red-400 font-medium">Seats fully allocated — contact your AM to purchase more</p>
                  </div>
                )}
                {isLow && !isFull && (
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">Only {remaining} seats remaining</p>
                  </div>
                )}

                {/* Cohort stats */}
                <div className="pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {prog.cohortCount} cohort{prog.cohortCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {prog.completedCohorts} completed
                    </span>
                  </div>
                  {prog.avgCompletion > 0 && (
                    <span className="text-xs font-medium text-primary">{prog.avgCompletion}% avg</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No programs assigned yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contact your Account Manager to purchase program seats
          </p>
        </div>
      )}

      {/* All cohorts by program */}
      {cohorts.length > 0 && (
        <div className="rounded-xl border bg-card overflow-auto">
          <div className="px-5 py-4 border-b">
            <h3>Active Cohorts by Program</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cohort</th>
                <th>Program</th>
                <th>Enrolled</th>
                <th>Completion</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map(c => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="font-medium text-sm">{c.name}</td>
                  <td className="text-sm">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      TYPE_COLOR[(c.programs as any)?.type] || 'bg-muted text-muted-foreground'
                    )}>
                      {(c.programs as any)?.code}
                    </span>
                    {' '}{(c.programs as any)?.name}
                  </td>
                  <td className="text-sm">{c.enrolled_count || 0}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${c.completion_pct || 0}%` }} />
                      </div>
                      <span className="text-xs font-medium">{Math.round(c.completion_pct || 0)}%</span>
                    </div>
                  </td>
                  <td><span className={getStatusBadge(c.status)}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
