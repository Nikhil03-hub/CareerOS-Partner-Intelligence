import { createClient } from '@/lib/supabase/server'
import { formatRelative } from '@/lib/utils'
import { MessageSquare, Phone, Video, StickyNote } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TYPE_ICONS = { note: StickyNote, meeting: Video, call: Phone }

export default async function AdminCommsPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase.from('communication_logs')
    .select('id, type, subject, body, created_by_name, created_at, next_meeting_at, colleges(name, code)')
    .order('created_at', { ascending: false })
    .limit(60)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Communications Log</h1>
        <p className="text-muted-foreground text-sm mt-1">All communications across partner colleges</p>
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
                <p className="text-xs text-muted-foreground mt-1">By {l.created_by_name}</p>
              </div>
            </div>
          )
        })}
        {(logs?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No communication logs</p>
        )}
      </div>
    </div>
  )
}
