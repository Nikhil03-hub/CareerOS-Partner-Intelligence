import { createClient } from '@/lib/supabase/server'
import { getStatusBadge, formatDate } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase.from('reports')
    .select('id, title, type, status, created_at, file_url, colleges(name, code)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>All Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Reports generated across all partner colleges</p>
      </div>

      <div className="rounded-xl border bg-card overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>College</th>
              <th>Report</th>
              <th>Type</th>
              <th>Generated</th>
              <th>Status</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {reports?.map(r => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td>
                  <span className="text-sm font-semibold text-primary">{(r.colleges as any)?.code}</span>
                </td>
                <td className="text-sm max-w-[200px] truncate">{r.title}</td>
                <td><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{(r as any).type}</span></td>
                <td className="text-xs text-muted-foreground">{formatDate(r.created_at)}</td>
                <td><span className={getStatusBadge(r.status || 'ready')}>{r.status || 'ready'}</span></td>
                <td>
                  {r.file_url
                    ? <a href={r.file_url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">Download</a>
                    : <span className="text-xs text-muted-foreground">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(reports?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No reports generated yet</p>
        )}
      </div>
    </div>
  )
}
