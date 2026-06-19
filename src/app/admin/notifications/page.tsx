import { createServiceClient } from '@/lib/supabase/server'
import { Bell, Mail, MessageCircle, AlertTriangle, CheckCircle, Info, DollarSign, TrendingDown } from 'lucide-react'
import { BroadcastButton } from './BroadcastButton'
import { GenerateAlertsButton } from './GenerateAlertsButton'

export const dynamic = 'force-dynamic'

const TYPE_META: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  'mou.expiring':              { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'MOU Expiry' },
  'training.low_completion':   { icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Low Completion' },
  'student.high_risk_cluster': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'High Risk' },
  'payment.overdue':           { icon: DollarSign, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Payment' },
  'placement.update':          { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Placement' },
  'general.announcement':      { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Announcement' },
}

function getChannelIcon(channel: string) {
  if (channel === 'email') return <Mail className="h-3 w-3" />
  if (channel === 'telegram') return <MessageCircle className="h-3 w-3" />
  return <Bell className="h-3 w-3" />
}

function getTimeBucket(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3600000
  if (diffH < 24) return 'Today'
  if (diffH < 48) return 'Yesterday'
  if (diffH < 168) return 'This Week'
  return 'Earlier'
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffM = Math.round((now.getTime() - d.getTime()) / 60000)
  if (diffM < 1) return 'just now'
  if (diffM < 60) return `${diffM}m ago`
  if (diffM < 1440) return `${Math.round(diffM / 60)}h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default async function AdminNotificationsPage() {
  const supabase = createServiceClient()

  const { data: notifications } = await supabase.from('notifications')
    .select('id, title, body, type, status, read, channels, created_at, colleges(name, code)')
    .order('created_at', { ascending: false })
    .limit(100)

  const all = notifications || []
  const unread = all.filter(n => !n.read).length
  const urgent = all.filter(n => ['mou.expiring', 'student.high_risk_cluster'].includes(n.type)).length

  // Group by time bucket
  const buckets: Record<string, typeof all> = {}
  for (const n of all) {
    const bucket = getTimeBucket(n.created_at)
    if (!buckets[bucket]) buckets[bucket] = []
    buckets[bucket].push(n)
  }
  const BUCKET_ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier']

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            System alerts and broadcast history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GenerateAlertsButton />
          <BroadcastButton />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="stat-label">Total Notifications</p>
          <p className="stat-value">{all.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Unread</p>
          <p className={`stat-value ${unread > 0 ? 'text-amber-500' : ''}`}>{unread}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Urgent Alerts</p>
          <p className={`stat-value ${urgent > 0 ? 'text-red-500' : ''}`}>{urgent}</p>
        </div>
      </div>

      {/* Notification Feed */}
      {all.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click &quot;Generate Alerts&quot; to scan for MOU expiry, low completion, and risk clusters
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {BUCKET_ORDER.filter(b => buckets[b]?.length).map(bucket => (
            <div key={bucket}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {bucket} · {buckets[bucket].length}
              </h3>
              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {buckets[bucket].map(n => {
                  const meta = TYPE_META[n.type] || TYPE_META['general.announcement']
                  const Icon = meta.icon
                  const channels: string[] = Array.isArray(n.channels) ? n.channels : ['in_app']
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors ${!n.read ? 'bg-primary/[0.02]' : ''}`}
                    >
                      {/* Unread indicator */}
                      <div className="mt-1.5 shrink-0">
                        {!n.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                        {n.read && <div className="h-2 w-2 rounded-full bg-transparent" />}
                      </div>

                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${meta.bg} shrink-0`}>
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug">{n.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {formatTimeAgo(n.created_at)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {/* Type badge */}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} font-medium`}>
                            {meta.label}
                          </span>
                          {/* College */}
                          {(n.colleges as any)?.code && (
                            <span className="text-xs text-muted-foreground font-medium">
                              {(n.colleges as any).code}
                            </span>
                          )}
                          {/* Channel icons */}
                          <div className="flex items-center gap-1 text-muted-foreground/60">
                            {channels.map((ch: string) => (
                              <span key={ch} title={ch}>{getChannelIcon(ch)}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
