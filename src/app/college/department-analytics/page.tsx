import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Users, Award, Target, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DepartmentAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  const [deptRes, studentsRes, placementsRes, enrollmentsRes] = await Promise.all([
    supabase.from('departments').select('id, name').eq('college_id', collegeId),
    supabase.from('students')
      .select('id, department_id, risk_level, placement_status, readiness_score, cgpa, departments(name)')
      .eq('college_id', collegeId),
    supabase.from('placements')
      .select('id, student_id, package_lpa, department')
      .eq('college_id', collegeId)
      .eq('status', 'accepted'),
    supabase.from('enrollments')
      .select('id, college_id, progress_pct, status')
      .eq('college_id', collegeId),
  ])

  const departments = deptRes.data || []
  const students = studentsRes.data || []
  const placements = placementsRes.data || []
  const enrollments = enrollmentsRes.data || []

  // Group students by department
  const deptMap = new Map<string, {
    name: string
    totalStudents: number
    placedCount: number
    highRisk: number
    avgReadiness: number
    avgCgpa: number
    avgPackage: number
    completionPct: number
  }>()

  departments.forEach(d => {
    const dStudents = students.filter(s => s.department_id === d.id)
    const dPlacements = placements.filter(p =>
      dStudents.some(s => s.id === p.student_id)
    )
    const placed = dStudents.filter(s => s.placement_status === 'placed' || s.placement_status === 'offer_accepted').length
    const highRisk = dStudents.filter(s => s.risk_level === 'high').length
    const avgReadiness = dStudents.length > 0
      ? Math.round(dStudents.reduce((a, s) => a + (s.readiness_score || 0), 0) / dStudents.length)
      : 0
    const avgCgpa = dStudents.length > 0
      ? parseFloat((dStudents.reduce((a, s) => a + (s.cgpa || 0), 0) / dStudents.length).toFixed(2))
      : 0
    const avgPackage = dPlacements.length > 0
      ? parseFloat((dPlacements.reduce((a, p) => a + (p.package_lpa || 0), 0) / dPlacements.length).toFixed(2))
      : 0

    // Enrollment completion for this department's students
    const dEnrollmentIds = dStudents.map(s => s.id)
    const dEnrollments = enrollments.filter(e => e.college_id === collegeId)
    const avgCompletion = dEnrollments.length > 0
      ? Math.round(dEnrollments.reduce((a, e) => a + (e.progress_pct || 0), 0) / dEnrollments.length)
      : 0

    deptMap.set(d.id, {
      name: d.name,
      totalStudents: dStudents.length,
      placedCount: placed,
      highRisk,
      avgReadiness,
      avgCgpa,
      avgPackage,
      completionPct: avgCompletion,
    })
  })

  const deptStats = Array.from(deptMap.entries())
    .map(([id, stats]) => ({ id, ...stats }))
    .filter(d => d.totalStudents > 0)
    .sort((a, b) => b.totalStudents - a.totalStudents)

  const maxStudents = Math.max(...deptStats.map(d => d.totalStudents), 1)
  const bestPlacement = deptStats.length > 0 ? Math.max(...deptStats.map(d =>
    d.totalStudents > 0 ? Math.round((d.placedCount / d.totalStudents) * 100) : 0
  )) : 0

  // College-wide aggregates for comparison
  const totalStudents = students.length
  const totalPlaced = students.filter(s => s.placement_status === 'placed' || s.placement_status === 'offer_accepted').length
  const collegeAvgPlacement = totalStudents > 0 ? Math.round((totalPlaced / totalStudents) * 100) : 0
  const collegeAvgReadiness = totalStudents > 0
    ? Math.round(students.reduce((a, s) => a + (s.readiness_score || 0), 0) / totalStudents)
    : 0

  const COLORS = ['blue', 'violet', 'green', 'orange', 'pink', 'indigo', 'teal', 'red']
  const COLOR_CLASS: Record<string, { bg: string; text: string; bar: string; light: string }> = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', bar: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-950/20' },
    violet: { bg: 'bg-violet-500', text: 'text-violet-600', bar: 'bg-violet-500', light: 'bg-violet-50 dark:bg-violet-950/20' },
    green: { bg: 'bg-green-500', text: 'text-green-600', bar: 'bg-green-500', light: 'bg-green-50 dark:bg-green-950/20' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-600', bar: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-950/20' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-600', bar: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-950/20' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', bar: 'bg-indigo-500', light: 'bg-indigo-50 dark:bg-indigo-950/20' },
    teal: { bg: 'bg-teal-500', text: 'text-teal-600', bar: 'bg-teal-500', light: 'bg-teal-50 dark:bg-teal-950/20' },
    red: { bg: 'bg-red-500', text: 'text-red-600', bar: 'bg-red-500', light: 'bg-red-50 dark:bg-red-950/20' },
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Department Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Compare placement, training, and risk across all departments</p>
      </div>

      {/* College-wide summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Total Students</p>
          <p className="stat-value">{totalStudents}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">College Placement %</p>
          <p className="stat-value text-green-600">{collegeAvgPlacement}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Readiness</p>
          <p className="stat-value text-primary">{collegeAvgReadiness}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Departments Active</p>
          <p className="stat-value">{deptStats.length}</p>
        </div>
      </div>

      {deptStats.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
          <p className="text-sm font-medium">No department data available yet</p>
        </div>
      ) : (
        <>
          {/* Department cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {deptStats.map((dept, idx) => {
              const color = COLOR_CLASS[COLORS[idx % COLORS.length]]
              const placementPct = dept.totalStudents > 0
                ? Math.round((dept.placedCount / dept.totalStudents) * 100)
                : 0
              const isBest = placementPct === bestPlacement && bestPlacement > 0
              const vsAvg = placementPct - collegeAvgPlacement

              return (
                <div key={dept.id} className="rounded-xl border bg-card p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2.5 w-2.5 rounded-full', color.bg)} />
                        <h3 className="text-base font-bold">{dept.name}</h3>
                        {isBest && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full font-semibold">
                            🥇 Top Dept
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{dept.totalStudents} students</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-2xl font-bold', color.text)}>{placementPct}%</p>
                      <p className="text-[10px] text-muted-foreground">placed</p>
                    </div>
                  </div>

                  {/* Placement bar */}
                  <div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full', color.bar)} style={{ width: `${placementPct}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{dept.placedCount} placed</span>
                      {vsAvg !== 0 && (
                        <span className={cn('text-xs font-medium flex items-center gap-0.5',
                          vsAvg > 0 ? 'text-green-600' : 'text-red-500'
                        )}>
                          {vsAvg > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {vsAvg > 0 ? '+' : ''}{vsAvg}% vs avg
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className={cn('rounded-lg p-2', color.light)}>
                      <p className="text-[10px] text-muted-foreground">Avg Readiness</p>
                      <p className={cn('text-sm font-bold', color.text)}>{dept.avgReadiness}%</p>
                    </div>
                    <div className={cn('rounded-lg p-2', color.light)}>
                      <p className="text-[10px] text-muted-foreground">Avg CGPA</p>
                      <p className={cn('text-sm font-bold', color.text)}>{dept.avgCgpa}</p>
                    </div>
                    <div className={cn('rounded-lg p-2', color.light)}>
                      <p className="text-[10px] text-muted-foreground">Avg Package</p>
                      <p className={cn('text-sm font-bold', color.text)}>
                        {dept.avgPackage > 0 ? `₹${dept.avgPackage}L` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Risk indicator */}
                  {dept.highRisk > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                        {dept.highRisk} high-risk student{dept.highRisk !== 1 ? 's' : ''} — intervention needed
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Comparison table */}
          <div className="rounded-xl border bg-card overflow-auto">
            <div className="px-5 py-4 border-b">
              <h3>Department Comparison</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Side-by-side ranking across all key metrics</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Department</th>
                  <th>Students</th>
                  <th>Placement %</th>
                  <th>Avg Readiness</th>
                  <th>Avg CGPA</th>
                  <th>Avg Package</th>
                  <th>High Risk</th>
                </tr>
              </thead>
              <tbody>
                {[...deptStats]
                  .sort((a, b) => {
                    const aPct = a.totalStudents > 0 ? (a.placedCount / a.totalStudents) : 0
                    const bPct = b.totalStudents > 0 ? (b.placedCount / b.totalStudents) : 0
                    return bPct - aPct
                  })
                  .map((dept, idx) => {
                    const placementPct = dept.totalStudents > 0
                      ? Math.round((dept.placedCount / dept.totalStudents) * 100)
                      : 0
                    const color = COLOR_CLASS[COLORS[
                      deptStats.findIndex(d => d.id === dept.id) % COLORS.length
                    ]]
                    return (
                      <tr key={dept.id} className="hover:bg-muted/30">
                        <td>
                          <span className="font-bold text-sm">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className={cn('h-2 w-2 rounded-full', color.bg)} />
                            <span className="text-sm font-medium">{dept.name}</span>
                          </div>
                        </td>
                        <td className="text-sm">{dept.totalStudents}</td>
                        <td>
                          <span className={cn('text-sm font-semibold',
                            placementPct >= 70 ? 'text-green-600' : placementPct >= 50 ? 'text-yellow-600' : 'text-red-500'
                          )}>
                            {placementPct}%
                          </span>
                        </td>
                        <td className="text-sm">{dept.avgReadiness}%</td>
                        <td className="text-sm">{dept.avgCgpa}</td>
                        <td className="text-sm font-medium">{dept.avgPackage > 0 ? `₹${dept.avgPackage}L` : '—'}</td>
                        <td>
                          {dept.highRisk > 0 ? (
                            <span className="badge badge-red">{dept.highRisk}</span>
                          ) : (
                            <span className="text-xs text-green-600">None</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
