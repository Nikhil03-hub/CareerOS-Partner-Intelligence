import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Bell, CheckCheck } from 'lucide-react'
import { MarkAllReadButton } from './MarkAllReadButton'

export const dynamic = 'force-dynamic'

const EVENT_ICONS: Record<string, string> = {
  'college.approved': '🎉',
  'mou.uploaded': '📄',
  'mou.expiring': '⚠️',
  'placement.accepted': '🎯',
  'fdp.scheduled': '📅',
  'report.generated': '📊',
  'payment.received': '💰',
  'student.at_risk': '🚨',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase.from('notifications')
    .select('*')
    .eq('recipient_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{notifications?.length || 0} notifications</p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton userId={user.id} />}
      </div>

      <div className="rounded-xl border bg-card divide-y">
        {notifications?.map(n => (
          <div key={n.id} className={cn('px-5 py-4 flex gap-4 hover:bg-muted/20 transition-colors', !n.read && 'bg-primary/5')}>
            <div className="text-xl shrink-0">{EVENT_ICONS[n.type] || '🔔'}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={cn('text-sm', !n.read ? 'font-semibold' : 'font-medium')}>{n.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <span className="text-xs text-muted-foreground">{formatRelative(n.created_at)}</span>
                </div>
              </div>
              {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
            </div>
          </div>
        ))}
        {(notifications?.length || 0) === 0 && (
          <div className="px-5 py-12 text-center">
            <CheckCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  )
}
