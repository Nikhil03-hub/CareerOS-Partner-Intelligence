import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStatusBadge, formatDate, formatDaysUntil } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { AlertTriangle, FileText, CheckCircle2 } from 'lucide-react'
import { MOUUploadButton } from './MOUUploadButton'

export const dynamic = 'force-dynamic'

export default async function MOUPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  const { data: mous } = await supabase.from('mous')
    .select('*')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false })

  const activeMOU = mous?.find(m => m.status === 'active' || m.status === 'expiring')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>MOU Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Memorandum of Understanding with Skill Tank</p>
        </div>
        <MOUUploadButton collegeId={collegeId} />
      </div>

      {/* Active MOU card */}
      {activeMOU && (
        <div className={cn('rounded-xl border-2 p-6',
          activeMOU.status === 'expiring' ? 'border-yellow-400 bg-yellow-50' : 'border-green-300 bg-green-50'
        )}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {activeMOU.status === 'expiring'
                ? <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0" />
                : <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              }
              <div>
                <h3 className={activeMOU.status === 'expiring' ? 'text-yellow-900' : 'text-green-900'}>{activeMOU.title}</h3>
                <p className="text-sm mt-1 text-muted-foreground">{activeMOU.partnership_type}</p>
              </div>
            </div>
            <span className={getStatusBadge(activeMOU.status)}>{activeMOU.status}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            {[
              { label: 'Start Date', value: formatDate(activeMOU.start_date) },
              { label: 'Expiry Date', value: formatDate(activeMOU.expiry_date) },
              { label: 'Time Left', value: formatDaysUntil(activeMOU.expiry_date) },
              { label: 'Revenue Share', value: `${activeMOU.revenue_share_pct}%` },
              { label: 'Seats Purchased', value: activeMOU.seats_purchased },
              { label: 'Seats Used', value: activeMOU.seats_used },
              { label: 'Accrued Share', value: `₹${((activeMOU.accrued_share_inr || 0) / 100000).toFixed(2)}L` },
              { label: 'eSign Status', value: activeMOU.esign_status || 'pending' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-semibold text-sm mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {activeMOU.status === 'expiring' && (
            <div className="mt-4 flex gap-3">
              <button className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Request Renewal
              </button>
              <button className="border border-yellow-400 text-yellow-800 hover:bg-yellow-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Download PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* All MOUs */}
      <div className="rounded-xl border bg-card overflow-auto">
        <div className="px-5 py-4 border-b"><h3>All MOUs</h3></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Partnership</th>
              <th>Start</th>
              <th>Expiry</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {mous?.map(m => (
              <tr key={m.id} className="hover:bg-muted/30">
                <td className="text-sm font-medium max-w-[200px] truncate">{m.title}</td>
                <td className="text-xs text-muted-foreground">{m.partnership_type}</td>
                <td className="text-xs">{formatDate(m.start_date)}</td>
                <td className="text-xs">{formatDate(m.expiry_date)}</td>
                <td className="text-sm">{m.seats_used}/{m.seats_purchased}</td>
                <td><span className={getStatusBadge(m.status)}>{m.status}</span></td>
                <td>
                  {m.document_name
                    ? <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1"><FileText className="h-3 w-3" />{m.document_name}</a>
                    : <span className="text-xs text-muted-foreground">Not uploaded</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(mous?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No MOUs found</p>
        )}
      </div>
    </div>
  )
}
