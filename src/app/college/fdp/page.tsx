import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStatusBadge, formatDate, cn } from '@/lib/utils'
import { ScheduleFDPButton } from './ScheduleFDPButton'

export const dynamic = 'force-dynamic'

export default async function FDPPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  const [sessions, { count: totalFaculty }, stats] = await Promise.all([
    supabase.from('fdp_sessions').select(`
      id, title, speaker, topic, date, start_time, end_time, mode, capacity,
      registered_count, status, venue
    `).eq('college_id', collegeId).order('date', { ascending: false }),
    supabase.from('faculty').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
    supabase.from('fdp_sessions').select('status').eq('college_id', collegeId),
  ])

  const completed = stats.data?.filter(s => s.status === 'completed').length || 0
  const scheduled = stats.data?.filter(s => s.status === 'scheduled').length || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Faculty Development Programme</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and track FDP sessions for your faculty</p>
        </div>
        <ScheduleFDPButton collegeId={collegeId} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card"><p className="stat-label">Total Sessions</p><p className="stat-value">{stats.data?.length || 0}</p></div>
        <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value">{completed}</p></div>
        <div className="stat-card"><p className="stat-label">Upcoming</p><p className="stat-value">{scheduled}</p></div>
        <div className="stat-card"><p className="stat-label">Faculty</p><p className="stat-value">{totalFaculty || 0}</p></div>
      </div>

      {/* Sessions */}
      <div className="rounded-xl border bg-card overflow-auto">
        <div className="px-5 py-4 border-b"><h3>All FDP Sessions</h3></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Speaker</th>
              <th>Date</th>
              <th>Mode</th>
              <th>Venue</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.data?.map(s => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.topic}</p>
                </td>
                <td className="text-sm">{s.speaker}</td>
                <td>
                  <p className="text-sm">{formatDate(s.date)}</p>
                  <p className="text-xs text-muted-foreground">{s.start_time} – {s.end_time}</p>
                </td>
                <td>
                  <span className={cn('badge text-xs',
                    s.mode === 'online' ? 'bg-blue-100 text-blue-800' :
                    s.mode === 'offline' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                  )}>{s.mode}</span>
                </td>
                <td className="text-xs text-muted-foreground max-w-[120px] truncate">{s.venue || '—'}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ((s.registered_count || 0) / (s.capacity || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs">{s.registered_count}/{s.capacity}</span>
                  </div>
                </td>
                <td><span className={getStatusBadge(s.status)}>{s.status}</span></td>
                <td>
                  <button className="text-xs text-primary hover:underline">Attendance</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(sessions.data?.length || 0) === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No FDP sessions yet. Schedule one!</p>
        )}
      </div>
    </div>
  )
}
