import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, cn } from '@/lib/utils'
import { WorkshopActionButtons } from './WorkshopActionButtons'
import { Calendar, Wrench, CheckCircle, XCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge badge-yellow',
  reviewing: 'badge badge-blue',
  approved: 'badge badge-green',
  declined: 'badge badge-red',
  scheduled: 'badge bg-purple-100 text-purple-700 border-purple-200',
}

const TYPE_LABEL: Record<string, string> = {
  workshop: '🛠 Workshop',
  hackathon: '⚡ Hackathon',
  seminar: '🎤 Seminar',
}

export default async function AdminWorkshopsPage() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')
  const role = user.user_metadata?.role
  if (!['super_admin', 'account_manager'].includes(role)) redirect('/college/dashboard')

  const supabase = createServiceClient()

  const { data: requests, error } = await supabase
    .from('workshop_requests')
    .select('*, colleges(id, name, code)')
    .order('created_at', { ascending: false })

  if (error && error.code === '42P01') {
    return (
      <div className="p-6">
        <h1>Workshop Requests</h1>
        <p className="text-muted-foreground mt-2">No workshop requests yet — the table will be created when the first request is submitted.</p>
      </div>
    )
  }

  const allRequests = requests || []
  const pending = allRequests.filter(r => r.status === 'pending' || r.status === 'reviewing')
  const resolved = allRequests.filter(r => r.status === 'approved' || r.status === 'declined' || r.status === 'scheduled')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Workshop Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">{allRequests.length} total requests</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: allRequests.filter(r => r.status === 'pending').length, cls: 'text-yellow-600', icon: Clock },
          { label: 'Reviewing', value: allRequests.filter(r => r.status === 'reviewing').length, cls: 'text-blue-600', icon: Clock },
          { label: 'Approved', value: allRequests.filter(r => r.status === 'approved' || r.status === 'scheduled').length, cls: 'text-green-600', icon: CheckCircle },
          { label: 'Declined', value: allRequests.filter(r => r.status === 'declined').length, cls: 'text-red-500', icon: XCircle },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <p className="stat-label">{k.label}</p>
            <p className={cn('stat-value', k.cls)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Pending section */}
      {pending.length > 0 && (
        <div className="rounded-xl border bg-card overflow-auto">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <h3>Needs Action ({pending.length})</h3>
          </div>
          <div className="divide-y">
            {pending.map(r => {
              const college = r.colleges as any
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{college?.name || college?.code}</span>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                          STATUS_BADGE[r.status] || 'badge'
                        )}>{r.status}</span>
                        <span className="text-xs text-muted-foreground">{TYPE_LABEL[r.type] || r.type}</span>
                      </div>
                      <p className="text-sm font-medium mt-1">{r.topic}</p>
                      {r.preferred_date && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Preferred: {formatDate(r.preferred_date)}
                        </p>
                      )}
                      {r.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{r.notes}"</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">Requested {formatDate(r.created_at)}</p>
                    </div>
                    <WorkshopActionButtons requestId={r.id} currentStatus={r.status} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Resolved section */}
      {resolved.length > 0 && (
        <div className="rounded-xl border bg-card overflow-auto">
          <div className="px-5 py-4 border-b">
            <h3>Resolved Requests</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>College</th>
                <th>Type</th>
                <th>Topic</th>
                <th>Preferred Date</th>
                <th>Status</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map(r => {
                const college = r.colleges as any
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="text-sm font-medium">{college?.name || college?.code}</td>
                    <td className="text-sm">{TYPE_LABEL[r.type] || r.type}</td>
                    <td className="text-sm max-w-[200px] truncate">{r.topic}</td>
                    <td className="text-sm">{r.preferred_date ? formatDate(r.preferred_date) : '—'}</td>
                    <td><span className={cn(STATUS_BADGE[r.status] || 'badge')}>{r.status}</span></td>
                    <td className="text-sm text-muted-foreground">{formatDate(r.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {allRequests.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Wrench className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
          <p className="text-sm font-medium">No workshop requests yet</p>
          <p className="text-xs text-muted-foreground mt-1">Requests submitted by colleges will appear here</p>
        </div>
      )}
    </div>
  )
}
