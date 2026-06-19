import { createServiceClient } from '@/lib/supabase/server'
import { getStatusBadge, cn } from '@/lib/utils'
import Link from 'next/link'
import { AddStudentButton } from './AddStudentButton'
import { PlacementPredictorModal } from './PlacementPredictorModal'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: { risk?: string; q?: string; page?: string; college?: string }
}) {
  const supabase = createServiceClient()
  const riskFilter = searchParams.risk || 'all'
  const q = searchParams.q || ''
  const collegeFilter = searchParams.college || 'all'
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('students')
    .select(
      'id, name, email, cgpa, placement_status, risk_level, readiness_score, ats_score, colleges(name, code), departments(name)',
      { count: 'exact' }
    )
    .order('readiness_score', { ascending: false })
    .range(from, to)

  if (riskFilter !== 'all') query = query.eq('risk_level', riskFilter)
  if (q) query = query.ilike('name', `%${q}%`)
  if (collegeFilter !== 'all') query = query.eq('college_id', collegeFilter)

  const [{ data: students, error: studentsError, count }, { data: colleges }] = await Promise.all([
    query,
    supabase.from('colleges').select('id, name, code').order('code'),
  ])

  if (studentsError) console.error('[students/page] query:', studentsError)

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const highRisk = students?.filter(s => s.risk_level === 'high').length || 0

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(riskFilter !== 'all' ? { risk: riskFilter } : {}),
      ...(q ? { q } : {}),
      ...(collegeFilter !== 'all' ? { college: collegeFilter } : {}),
      page: String(page),
      ...overrides,
    })
    return `/admin/students?${params.toString()}`
  }

  return (
    <div className="p-6 space-y-5">
      {studentsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <strong>Data load error:</strong> {studentsError.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1>All Students</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalCount.toLocaleString()} students &middot; {highRisk} high-risk on this page
          </p>
        </div>
        <AddStudentButton colleges={colleges || []} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {['all', 'high', 'medium', 'low'].map(r => (
          <Link
            key={r}
            href={buildHref({ risk: r, page: '1' })}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
              riskFilter === r
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-accent'
            )}
          >
            {r === 'all' ? 'All Risk' : `${r.charAt(0).toUpperCase() + r.slice(1)} Risk`}
          </Link>
        ))}

        <form method="get" action="/admin/students" className="flex items-center gap-2 ml-auto">
          <input type="hidden" name="risk" value={riskFilter} />
          <input type="hidden" name="page" value="1" />
          <select
            name="college"
            defaultValue={collegeFilter}
            className="px-3 py-1.5 rounded-lg border bg-background text-sm w-44 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Colleges</option>
            {(colleges || []).map(c => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search students..."
            className="px-3 py-1.5 rounded-lg border bg-background text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>College</th>
              <th>CGPA</th>
              <th>Readiness</th>
              <th>ATS</th>
              <th>Placement</th>
              <th>Risk</th>
              <th>AI</th>
            </tr>
          </thead>
          <tbody>
            {(students ?? []).map(s => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td>
                  <a
                    href={`/admin/students/${s.id}`}
                    className="font-medium text-sm hover:text-primary hover:underline transition-colors"
                  >
                    {s.name}
                  </a>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </td>
                <td className="text-sm font-semibold text-primary">{(s.colleges as any)?.code}</td>
                <td className="text-sm font-medium">{s.cgpa?.toFixed(2)}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${s.readiness_score || 0}%` }}
                      />
                    </div>
                    <span className="text-xs">{s.readiness_score}%</span>
                  </div>
                </td>
                <td
                  className={cn(
                    'text-sm font-semibold',
                    (s.ats_score || 0) >= 70 ? 'text-green-600' : 'text-yellow-600'
                  )}
                >
                  {s.ats_score || '—'}
                </td>
                <td>
                  <span className={getStatusBadge(s.placement_status)}>
                    {s.placement_status?.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span className={getStatusBadge(s.risk_level)}>{s.risk_level}</span>
                </td>
                <td>
                  <PlacementPredictorModal studentId={s.id} studentName={s.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(students?.length ?? 0) === 0 && !studentsError && (
          <div className="px-5 py-16 text-center">
            <div className="text-4xl mb-3">\U0001f393</div>
            <p className="font-semibold text-foreground mb-1">No students found</p>
            <p className="text-sm text-muted-foreground">
              {q || riskFilter !== 'all' ? 'Try adjusting your filters.' : 'Add students to see them here.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {from + 1}&ndash;{Math.min(to + 1, totalCount)} of{' '}
            <strong>{totalCount.toLocaleString()}</strong> students
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors font-medium"
              >
                &larr; Previous
              </Link>
            )}
            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors font-medium"
              >
                Next &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
