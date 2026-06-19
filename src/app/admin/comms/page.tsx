import { createServiceClient } from '@/lib/supabase/server'
import { formatRelative } from '@/lib/utils'
import { StickyNote, Phone, Video } from 'lucide-react'
import { LogCommButton } from './LogCommButton'

export const dynamic = 'force-dynamic'

const TYPE_ICONS = { note: StickyNote, meeting: Video, call: Phone }

export default async function AdminCommsPage() {
  const supabase = createServiceClient()

  const [{ data: logs }, { data: colleges }] = await Promise.all([
    supabase.from('communication_logs')
      .select('id, type, subject, body, created_by_name, created_at, next_meeting_at, colleges(name, code)')
      .order('created_at', { ascending: false })
      .limit(60),
    supabase.from('colleges').select('id, name, code').order('code'),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Communications Log</h1>
          <p className="text-muted-foreground text-sm mt-1">All communications across partner colleges</p>
        </div>
        <LogCommButton colleges={colleges || []} />
      </div>
      <div className="rounded-xl border bg-card divide-y">
        {logs?.map(l => {
          const Icon = TYPE_ICONS[l.type as keyof typeof TYPE_ICONS] || StickyNote
          return (
            <div key={l.id} className="px-5 py-4 flex gap-4 hover:bg-muted/20">
              <div className="p-2 rounded-lg bg-muted h-fit shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-primary mr-2">{(l.colleges as any)?.code}</span>
                    <span className="font-semibold text-sm">{l.subject}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelative(l.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{l.body}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-muted-foreground">By {l.created_by_name}</p>
                  {l.next_meeting_at && (
                    <p className="text-xs text-blue-600 font-medium">
                      Next: {new Date(l.next_meeting_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {(logs?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No communication logs. Use "Log Communication" to add one.</p>
        )}
      </div>
    </div>
  )
}
