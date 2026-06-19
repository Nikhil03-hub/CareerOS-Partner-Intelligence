import { createClient } from '@/lib/supabase/server'
import { getStatusBadge, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminTrainingPage() {
  const supabase = await createClient()

  const [cohorts, { count: totalEnrolled }, { count: completed }] = await Promise.all([
    supabase.from('cohorts')
      .select('id, name, enrolled_count, completion_pct, status, start_date, programs(name, code), colleges(name, code)')
      .order('created_at', { ascending: false })
      .limit(60),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Training Programs</h1>
        <p className="text-muted-foreground text-sm mt-1">All cohorts across partner colleges</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card"><p className="stat-label">Total Cohorts</p><p className="stat-value">{cohorts.data?.length || 0}</p></div>
        <div className="stat-card"><p className="stat-label">Active Enrollments</p><p className="stat-value">{totalEnrolled || 0}</p></div>
        <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value text-green-600">{completed || 0}</p></div>
      </div>

      <div className="rounded-xl border bg-card overflow-auto">
        <table className="data-table">
          <thead>
            <tr><th>Cohort</th><th>College</th><th>Program</th><th>Enrolled</th><th>Progress</th><th>Start</th><th>Status</th></tr>
          </thead>
          <tbody>
            {cohorts.data?.map(c => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="font-medium text-sm max-w-[180px] truncate">{c.name}</td>
                <td className="text-sm font-semibold text-primary">{(c.colleges as any)?.code}</td>
                <td><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{(c.programs as any)?.code}</span></td>
                <td className="text-sm">{c.enrolled_count}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${c.completion_pct || 0}%` }} /></div>
                    <span className="text-xs font-medium">{c.completion_pct?.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="text-xs text-muted-foreground">{c.start_date ? formatDate(c.start_date) : '—'}</td>
                <td><span className={getStatusBadge(c.status)}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
