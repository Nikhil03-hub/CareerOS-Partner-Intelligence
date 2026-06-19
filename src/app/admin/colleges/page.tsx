import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getStatusBadge, formatDate, calcHealthColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ApproveCollegeButton } from './ApproveCollegeButton'

export const dynamic = 'force-dynamic'

export default async function CollegesPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const supabase = createServiceClient()
  const status = searchParams.status || 'all'
  const q = searchParams.q || ''

  let query = supabase.from('colleges')
    .select('id, name, code, city, state, type, status, health_score, partnership_types, created_at')
    .order('created_at', { ascending: false })

  if (status !== 'all') query = query.eq('status', status)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: colleges, error: collegesError } = await query
  if (collegesError) {
    console.error('[colleges/page] query failed:', collegesError)
  }

  return (
    <div className="p-6 space-y-6">
      {collegesError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <strong>Data load error:</strong> {collegesError.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1>Colleges</h1>
          <p className="text-muted-foreground text-sm mt-1">{colleges?.length ?? 0} colleges</p>
        </div>
        <Link href="/signup" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Invite College
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {['all', 'approved', 'pending', 'suspended'].map(s => (
          <Link key={s} href={`/admin/colleges?status=${s}`}
            className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors border',
              status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'
            )}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
        <input
          defaultValue={q}
          placeholder="Search colleges..."
          className="ml-auto px-3 py-1.5 rounded-lg border bg-background text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>College</th>
              <th>Type</th>
              <th>Location</th>
              <th>Status</th>
              <th>Health</th>

              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(colleges ?? []).map(c => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td>
                  <Link href={`/admin/colleges/${c.id}`} className="font-semibold text-primary hover:underline">{c.code}</Link>
                  <p className="text-xs text-muted-foreground max-w-[200px] truncate">{c.name}</p>
                </td>
                <td className="text-sm">{c.type}</td>
                <td className="text-sm text-muted-foreground">{c.city}, {c.state}</td>
                <td><span className={getStatusBadge(c.status)}>{c.status}</span></td>
                <td>
                  <span className={cn('text-sm font-semibold', calcHealthColor(c.health_score || 0))}>
                    {c.health_score || '\u2014'}
                  </span>
                </td>

                <td className="text-sm text-muted-foreground">{formatDate(c.created_at)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/colleges/${c.id}`} className="text-xs text-primary hover:underline">View</Link>
                    <ApproveCollegeButton collegeId={c.id} collegeName={c.name} currentStatus={c.status} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(colleges?.length ?? 0) === 0 && !collegesError && (
          <div className="px-5 py-16 text-center">
            <div className="text-4xl mb-3">\U0001f3db\ufe0f</div>
            <p className="font-semibold text-foreground mb-1">No colleges found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {q || status !== 'all' ? 'Try adjusting your filters.' : 'Invite your first partner college to get started.'}
            </p>
            <a href="/signup" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              + Invite College
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
