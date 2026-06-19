import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, getStatusBadge } from '@/lib/utils'
import { GenerateReportButton } from './GenerateReportButton'
import { FileText, BarChart3, TrendingUp, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

const REPORT_TYPES = [
  { type: 'placement', title: 'Placement Report', desc: 'Year-wise placement statistics, company breakdown, package analysis', icon: TrendingUp, color: 'text-green-600' },
  { type: 'training', title: 'Training Report', desc: 'Cohort completion, enrollment stats, program-wise analytics', icon: BarChart3, color: 'text-blue-600' },
  { type: 'revenue', title: 'Revenue Report', desc: 'Revenue share calculations, payout history, seat utilization', icon: DollarSign, color: 'text-purple-600' },
  { type: 'executive', title: 'Executive Summary', desc: 'One-page AI-powered summary for leadership and accreditation', icon: FileText, color: 'text-orange-600' },
]

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  const { data: reports } = await supabase.from('reports')
    .select('*')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate and download placement, training, and executive reports</p>
      </div>

      {/* Report type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_TYPES.map(rt => (
          <div key={rt.type} className="rounded-xl border bg-card p-5 hover:border-primary transition-colors">
            <rt.icon className={`h-8 w-8 mb-3 ${rt.color}`} />
            <h3 className="text-sm font-semibold mb-1">{rt.title}</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{rt.desc}</p>
            <GenerateReportButton collegeId={collegeId} reportType={rt.type} reportTitle={rt.title} />
          </div>
        ))}
      </div>

      {/* Generated reports */}
      <div className="rounded-xl border bg-card overflow-auto">
        <div className="px-5 py-4 border-b">
          <h3>Generated Reports</h3>
          <p className="text-xs text-muted-foreground mt-0.5">All previously generated reports — download or re-generate</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
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
                <td className="font-medium text-sm">{r.title}</td>
                <td>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{(r as any).type}</span>
                </td>
                <td className="text-xs text-muted-foreground">{formatDate(r.created_at)}</td>
                <td><span className={getStatusBadge(r.status || 'ready')}>{r.status || 'ready'}</span></td>
                <td>
                  {r.file_url
                    ? <a href={r.file_url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">Download PDF</a>
                    : <span className="text-xs text-muted-foreground">Processing…</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(reports?.length || 0) === 0 && (
          <div className="px-5 py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No reports generated yet. Generate your first report above.</p>
          </div>
        )}
      </div>
    </div>
  )

}
