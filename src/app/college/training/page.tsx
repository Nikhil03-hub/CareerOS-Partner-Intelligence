import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStatusBadge, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  const [cohorts, programs, { count: totalEnrolled }, { count: completed }] = await Promise.all([
    supabase.from('cohorts')
      .select('id, name, status, enrolled_count, completion_pct, start_date, end_date, instructor, programs(name, code, type)')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false }),
    supabase.from('programs').select('id, name, code, type, duration_weeks, modules_count'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('college_id', collegeId).eq('status', 'in_progress'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('college_id', collegeId).eq('status', 'completed'),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Training Programs</h1>
          <p className="text-muted-foreground text-sm mt-1">{cohorts.data?.length || 0} cohorts · {totalEnrolled || 0} active enrollments</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card"><p className="stat-label">Active Cohorts</p><p className="stat-value">{cohorts.data?.filter(c => c.status === 'active').length || 0}</p></div>
        <div className="stat-card"><p className="stat-label">Active Enrollments</p><p className="stat-value">{totalEnrolled || 0}</p></div>
        <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value">{completed || 0}</p></div>
        <div className="stat-card"><p className="stat-label">Programs Available</p><p className="stat-value">{programs.data?.length || 0}</p></div>
      </div>

      {/* Cohorts */}
      <div className="rounded-xl border bg-card overflow-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3>Cohorts</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cohort Name</th>
              <th>Program</th>
              <th>Enrolled</th>
              <th>Progress</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Instructor</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.data?.map(c => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="font-medium text-sm max-w-[180px] truncate">{c.name}</td>
                <td>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{(c.programs as any)?.code}</span>
                </td>
                <td className="text-sm">{c.enrolled_count}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${c.completion_pct || 0}%` }} />
                    </div>
                    <span className="text-xs font-medium">{c.completion_pct?.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="text-xs text-muted-foreground">{c.start_date ? formatDate(c.start_date) : '—'}</td>
                <td className="text-xs text-muted-foreground">{c.end_date ? formatDate(c.end_date) : '—'}</td>
                <td><span className={getStatusBadge(c.status)}>{c.status}</span></td>
                <td className="text-xs text-muted-foreground">{c.instructor || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(cohorts.data?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No cohorts yet</p>
        )}
      </div>

      {/* Programs catalog */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b"><h3>Programs Catalog</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {programs.data?.map(p => (
            <div key={p.id} className="rounded-lg border p-4 hover:border-primary transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{p.code}</span>
                <span className="text-xs text-muted-foreground">{p.duration_weeks}w · {p.modules_count} modules</span>
              </div>
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
