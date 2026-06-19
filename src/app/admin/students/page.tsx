import { createServiceClient } from '@/lib/supabase/server'
import { getStatusBadge, cn } from '@/lib/utils'
import Link from 'next/link'
import { AddStudentButton } from './AddStudentButton'
import { PlacementPredictorModal } from './PlacementPredictorModal'

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage({ searchParams }: { searchParams: { risk?: string; q?: string } }) {
  const supabase = createServiceClient()
  const riskFilter = searchParams.risk || 'all'
  const q = searchParams.q || ''

  let query = supabase.from('students')
    .select('id, name, email, cgpa, placement_status, risk_level, readiness_score, ats_score, colleges(name, code), departments(name)')
    .order('readiness_score', { ascending: false })
    .limit(150)

  if (riskFilter !== 'all') query = query.eq('risk_level', riskFilter)
  if (q) query = query.ilike('name', `%${q}%`)

  const [{ data: students }, { data: colleges }] = await Promise.all([
    query,
    supabase.from('colleges').select('id, name, code').eq('status', 'active').order('code'),
  ])

  const highRisk = students?.filter(s => s.risk_level === 'high').length || 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1>All Students</h1>
          <p className="text-muted-foreground text-sm mt-1">{students?.length || 0} students · {highRisk} high-risk</p>
        </div>
        <AddStudentButton colleges={colleges || []} />
      </div>

      <div className="flex items-center gap-3">
        {['all', 'high', 'medium', 'low'].map(r => (
          <Link key={r} href={`/admin/students?risk=${r}`}
            className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
              riskFilter === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'
            )}>
            {r === 'all' ? 'All Students' : `${r.charAt(0).toUpperCase() + r.slice(1)} Risk`}
          </Link>
        ))}
      </div>

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
            {students?.map(s => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td>
                  <a href={`/admin/students/${s.id}`} className="font-medium text-sm hover:text-primary hover:underline transition-colors">{s.name}</a>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </td>
                <td className="text-sm font-semibold text-primary">{(s.colleges as any)?.code}</td>
                <td className="text-sm font-medium">{s.cgpa?.toFixed(2)}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${s.readiness_score || 0}%` }} />
                    </div>
                    <span className="text-xs">{s.readiness_score}%</span>
                  </div>
                </td>
                <td className={cn('text-sm font-semibold', (s.ats_score || 0) >= 70 ? 'text-green-600' : 'text-yellow-600')}>{s.ats_score || '—'}</td>
                <td><span className={getStatusBadge(s.placement_status)}>{s.placement_status?.replace('_', ' ')}</span></td>
                <td><span className={getStatusBadge(s.risk_level)}>{s.risk_level}</span></td>
                <td><PlacementPredictorModal studentId={s.id} studentName={s.name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
