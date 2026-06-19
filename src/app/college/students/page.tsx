import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStatusBadge, cn } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StudentsPage({ searchParams }: {
  searchParams: { q?: string; status?: string; risk?: string; page?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id
  if (!collegeId) redirect('/college/dashboard')

  const page = parseInt(searchParams.page || '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const q = searchParams.q || ''
  const statusFilter = searchParams.status || 'all'
  const riskFilter = searchParams.risk || 'all'

  let query = supabase.from('students')
    .select('id, name, email, roll_no, batch_year, cgpa, placement_status, risk_level, readiness_score, ats_score, skills, departments(name)', { count: 'exact' })
    .eq('college_id', collegeId)
    .order('readiness_score', { ascending: false })
    .range(from, from + pageSize - 1)

  if (q) query = query.ilike('name', `%${q}%`)
  if (statusFilter !== 'all') query = query.eq('placement_status', statusFilter)
  if (riskFilter !== 'all') query = query.eq('risk_level', riskFilter)

  const { data: students, count } = await query
  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1>Students</h1>
          <p className="text-muted-foreground text-sm mt-1">{count || 0} students</p>
        </div>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {['all', 'placed', 'in_process', 'unplaced'].map(s => (
          <Link key={s} href={`/college/students?status=${s}`}
            className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
              statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'
            )}>
            {s === 'all' ? 'All' : s === 'in_process' ? 'In Process' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
        <div className="ml-2 flex gap-2">
          {['all', 'high', 'medium', 'low'].map(r => (
            <Link key={r} href={`/college/students?status=${statusFilter}&risk=${r}`}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                riskFilter === r ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border text-muted-foreground hover:bg-accent'
              )}>
              {r === 'all' ? 'All Risk' : `${r.charAt(0).toUpperCase() + r.slice(1)} Risk`}
            </Link>
          ))}
        </div>
        <input
          defaultValue={q}
          placeholder="Search by name…"
          className="ml-auto px-3 py-1.5 rounded-lg border bg-background text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll No</th>
              <th>Dept</th>
              <th>Batch</th>
              <th>CGPA</th>
              <th>Readiness</th>
              <th>ATS Score</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Top Skills</th>
            </tr>
          </thead>
          <tbody>
            {students?.map(s => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td>
                  <Link href={`/college/students/${s.id}`} className="font-medium text-primary hover:underline text-sm">{s.name}</Link>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </td>
                <td className="text-xs text-muted-foreground font-mono">{s.roll_no}</td>
                <td className="text-xs">{(s.departments as any)?.name || '—'}</td>
                <td className="text-sm">{s.batch_year}</td>
                <td className="text-sm font-medium">{s.cgpa?.toFixed(2)}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${s.readiness_score || 0}%` }} />
                    </div>
                    <span className="text-xs font-medium">{s.readiness_score}%</span>
                  </div>
                </td>
                <td className={cn('text-sm font-semibold', (s.ats_score || 0) >= 70 ? 'text-green-600' : 'text-yellow-600')}>{s.ats_score || '—'}</td>
                <td><span className={getStatusBadge(s.placement_status)}>{s.placement_status?.replace('_', ' ')}</span></td>
                <td><span className={getStatusBadge(s.risk_level)}>{s.risk_level}</span></td>
                <td className="text-xs text-muted-foreground max-w-[140px] truncate">{(s.skills as string[])?.slice(0, 3).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(students?.length || 0) === 0 && (
          <div className="px-5 py-12 text-center text-muted-foreground text-sm">No students found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <Link key={p} href={`/college/students?page=${p}&status=${statusFilter}&risk=${riskFilter}`}
              className={cn('w-8 h-8 flex items-center justify-center rounded text-sm',
                page === p ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'
              )}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
