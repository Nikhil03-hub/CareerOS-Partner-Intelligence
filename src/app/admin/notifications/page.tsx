import { createClient } from '@/lib/supabase/server'
import { formatRelative, getStatusBadge } from '@/lib/utils'
import { BroadcastButton } from './BroadcastButton'

export const dynamic = 'force-dynamic'

export default async function AdminNotificationsPage() {
  const supabase = await createClient()

  const { data: notifications } = await supabase.from('notifications')
    .select('id, title, body, type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">System notification history and broadcast tool</p>
        </div>
        <BroadcastButton />
      </div>

      <div className="rounded-xl border bg-card overflow-auto">
        <table className="data-table">
          <thead><tr><th>Title</th><th>Type</th><th>Sent</th><th>Status</th></tr></thead>
          <tbody>
            {notifications?.map(n => (
              <tr key={n.id} className="hover:bg-muted/30">
                <td>
                  <p className="font-medium text-sm">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">{n.body}</p>}
                </td>
                <td><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{n.type}</span></td>
                <td className="text-xs text-muted-foreground">{formatRelative(n.created_at)}</td>
                <td><span className={getStatusBadge(n.status)}>{n.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(notifications?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No notifications sent yet</p>
        )}
      </div>
    </div>
  )
}
