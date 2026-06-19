import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { MessageSquare, Phone, Video, StickyNote } from 'lucide-react'
import { LogCommButton } from './LogCommButton'

export const dynamic = 'force-dynamic'

const TYPE_ICONS = {
  note: StickyNote,
  meeting: Video,
  call: Phone,
}

export default async function CommsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  const { data: logs } = await supabase.from('communication_logs')
    .select('*')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false })

  const noteCount = logs?.filter(l => l.type === 'note').length || 0
  const meetingCount = logs?.filter(l => l.type === 'meeting').length || 0
  const callCount = logs?.filter(l => l.type === 'call').length || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Communication Log</h1>
          <p className="text-muted-foreground text-sm mt-1">All interactions with Skill Tank account managers</p>
        </div>
        <LogCommButton collegeId={collegeId} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Notes', count: noteCount, icon: StickyNote, color: 'text-yellow-600' },
          { label: 'Meetings', count: meetingCount, icon: Video, color: 'text-blue-600' },
          { label: 'Calls', count: callCount, icon: Phone, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-4">
            <s.icon className={cn('h-8 w-8', s.color)} />
            <div>
              <p className="stat-value">{s.count}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b"><h3>Communication Timeline</h3></div>
        <div className="divide-y">
          {logs?.map(l => {
            const Icon = TYPE_ICONS[l.type as keyof typeof TYPE_ICONS] || StickyNote
            return (
              <div key={l.id} className="px-5 py-4 flex gap-4 hover:bg-muted/20 transition-colors">
                <div className={cn('p-2 rounded-lg shrink-0 h-fit',
                  l.type === 'note' ? 'bg-yellow-100 text-yellow-600' :
                  l.type === 'meeting' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{l.subject}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{formatRelative(l.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{l.body}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs text-muted-foreground">By {l.created_by_name}</p>
                    {l.next_meeting_at && (
                      <p className="text-xs text-primary">Next: {formatDate(l.next_meeting_at)}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {(logs?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No communication logs yet</p>
        )}
      </div>
    </div>
  )
}
