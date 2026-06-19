import { createServiceClient } from '@/lib/supabase/server'
import { getStatusBadge, formatDate } from '@/lib/utils'
import { BarChart2, TrendingUp, FileText, DollarSign } from 'lucide-react'
import { GenerateReportButton } from './GenerateReportButton'

export const dynamic = 'force-dynamic'

const REPORT_TYPES = [
  {
    type: 'placement',
    label: 'Placement Report',
    icon: 'TrendingUp',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    desc: 'Placement rates, company-wise data, year-on-year trend, student risk breakdown, KMIT benchmark.',
  },
  {
    type: 'health',
    label: 'College Health Report',
    icon: 'BarChart2',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    desc: 'AI Health Score with 6-factor breakdown: placement, training, MOU, FDP, communication, revenue.',
  },
  {
    type: 'quarterly',
    label: 'Quarterly Partnership',
    icon: 'FileText',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    desc: 'Full quarter review: placements, training, FDP sessions, communications, MOU status, revenue.',
  },
  {
    type: 'revenue',
    label: 'Revenue Report',
    icon: 'DollarSign',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    desc: 'Revenue share history, payout status, accrued amounts, seat utilisation, outstanding balances.',
  },
]

export default async function AdminReportsPage() {
  const supabase = createServiceClient()

  const [{ data: reports }, { data: colleges }] = await Promise.all([
    supabase.from('reports')
      .select('id, title, type, status, created_at, file_url, ai_summary, colleges(name, code)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('colleges')
      .select('id, name, code')
      .eq('status', 'approved')
      .order('name'),
  ])

  const collegeList = colleges || []

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1>Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate AI-powered PDF reports with executive summaries from live platform data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {REPORT_TYPES.map(rt => (
          <div key={rt.type} className="rounded-xl border bg-card p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${rt.bg} shrink-0`}>
                <FileText className={`h-5 w-5 ${rt.color}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">{rt.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rt.desc}</p>
              </div>
            </div>
            <GenerateReportButton
              reportType={rt.type}
              reportLabel={rt.label}
              colleges={collegeList}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Generated Reports</h2>
          <span className="text-sm text-muted-foreground">{reports?.length || 0} total</span>
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
                <th>AI Summary</th>
              </tr>
            </thead>
            <tbody>
              {reports?.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td>
                    <span className="text-sm font-semibold text-primary">{(r.colleges as any)?.code}</span>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{(r.colleges as any)?.name}</p>
                  </td>
                  <td className="text-sm font-medium max-w-[180px] truncate">{r.title}</td>
                  <td>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                      {(r as any).type}
                    </span>
                  </td>
                  <td className="text-xs text-muted-foreground">{formatDate(r.created_at)}</td>
                  <td><span className={getStatusBadge(r.status || 'ready')}>{r.status || 'ready'}</span></td>
                  <td className="text-xs text-muted-foreground max-w-[200px]">
                    {r.ai_summary
                      ? <span className="line-clamp-2">{r.ai_summary.slice(0, 120)}</span>
                      : <span className="italic text-muted-foreground/50">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(reports?.length || 0) === 0 && (
            <div className="px-5 py-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reports yet — generate your first report above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
