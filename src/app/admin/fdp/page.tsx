import { createClient } from '@/lib/supabase/server'
import { getStatusBadge, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminFDPPage() {
  const supabase = await createClient()

  const [sessions, stats] = await Promise.all([
    supabase.from('fdp_sessions')
      .select('id, title, speaker, topic, date, mode, capacity, registered_count, status, colleges(name, code)')
      .order('date', { ascending: false })
      .limit(60),
    supabase.from('fdp_sessions').select('status'),
  ])

  const completed = stats.data?.filter(s => s.status === 'completed').length || 0
  const scheduled = stats.data?.filter(s => s.status === 'scheduled').length || 0
  const total = stats.data?.length || 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>FDP Sessions</h1>
        <p className="text-muted-foreground text-sm mt-1">All Faculty Development Programmes across partner colleges</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card"><p className="stat-label">Total Sessions</p><p className="stat-value">{total}</p></div>
        <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value text-green-600">{completed}</p></div>
        <div className="stat-card"><p className="stat-label">Upcoming</p><p className="stat-value text-blue-600">{scheduled}</p></div>
      </div>

      <div className="rounded-xl border bg-card overflow-auto">
        <table className="data-table">
          <thead>
            <tr><th>College</th><th>Title</th><th>Speaker</th><th>Date</th><th>Mode</th><th>Registered</th><th>Status</th></tr>
          </thead>
          <tbody>
            {sessions.data?.map(s => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="text-sm font-semibold text-primary">{(s.colleges as any)?.code}</td>
                <td className="text-sm font-medium max-w-[180px] truncate">{s.title}</td>
                <td className="text-sm">{s.speaker}</td>
                <td className="text-sm">{formatDate(s.date)}</td>
                <td><span className="text-xs badge badge-blue">{s.mode}</span></td>
                <td className="text-sm">{s.registered_count}/{s.capacity}</td>
                <td><span className={getStatusBadge(s.status)}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(sessions.data?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No FDP sessions found</p>
        )}
      </div>
    </div>
  )
}
