import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getStatusBadge, calcHealthLabel, calcHealthColor } from '@/lib/utils'
import { Building2, Users, TrendingUp, DollarSign, AlertTriangle, FileText } from 'lucide-react'
import { StatsCard } from '@/components/shared/StatsCard'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export default async function AdminDashboard() {
  const supabase = createServiceClient()

  // Fetch aggregates in parallel
  const [
    { count: totalColleges },
    { count: activeColleges },
    { count: pendingColleges },
    { count: totalStudents },
    { count: placedStudents },
    colleges,
    expiringMOUs,
    recentEvents,
  ] = await Promise.all([
    supabase.from('colleges').select('*', { count: 'exact', head: true }),
    supabase.from('colleges').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('colleges').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('placement_status', 'placed'),
    supabase.from('colleges').select('id, name, code, health_score, status, city, state').order('health_score', { ascending: true }).limit(6),
    supabase.from('mous').select('id, title, expiry_date, status, colleges(name, code)').eq('status', 'expiring').order('expiry_date').limit(5),
    supabase.from('activity_events').select('id, title, event_type, created_at, colleges(name, code)').order('created_at', { ascending: false }).limit(8),
  ])

  const placementRate = totalStudents ? Math.round(((placedStudents || 0) / totalStudents) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">CareerOS Partner Intelligence — overview of all colleges</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Partner Colleges" value={activeColleges || 0} icon={Building2}
          delta={`${pendingColleges || 0} pending approval`} trend="neutral" />
        <StatsCard title="Total Students" value={(totalStudents || 0).toLocaleString()} icon={Users}
          delta={`${placementRate}% placed`} trend="up" />
        <StatsCard title="Placement Rate" value={`${placementRate}%`} icon={TrendingUp}
          trend="up" />
        <StatsCard title="Colleges At Risk" value={(colleges.data?.filter(c => (c.health_score || 0) < 50).length || 0)}
          icon={AlertTriangle} iconColor="text-red-500" trend="down" delta="health score <50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* College Health Table */}
        <div className="lg:col-span-2 rounded-xl border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3>College Health Scores</h3>
            <Link href="/admin/colleges" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>College</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {colleges.data?.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td>
                      <Link href={`/admin/colleges/${c.id}`} className="font-medium text-primary hover:underline text-sm">{c.code}</Link>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{c.name}</p>
                    </td>
                    <td className="text-sm text-muted-foreground">{c.city}</td>
                    <td><span className={getStatusBadge(c.status)}>{c.status}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${c.health_score || 0}%` }} />
                        </div>
                        <span className={cn('text-sm font-semibold', calcHealthColor(c.health_score || 0))}>
                          {c.health_score || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: expiring MOUs + activity */}
        <div className="space-y-4">
          {/* Expiring MOUs */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" /> Expiring MOUs
              </h3>
              <Link href="/admin/mous" className="text-xs text-primary hover:underline">All MOUs →</Link>
            </div>
            <div className="divide-y">
              {(expiringMOUs.data?.length || 0) === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">No MOUs expiring soon</p>
              )}
              {expiringMOUs.data?.map(m => {
                const daysLeft = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000)
                return (
                  <div key={m.id} className="px-4 py-3">
                    <p className="text-sm font-medium">{(m.colleges as any)?.code}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(m.expiry_date)}</p>
                    <span className={cn('text-xs font-semibold', daysLeft <= 7 ? 'text-red-500' : 'text-yellow-600')}>
                      {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">Recent Activity</h3>
            </div>
            <div className="divide-y max-h-52 overflow-y-auto">
              {recentEvents.data?.map(e => (
                <div key={e.id} className="px-4 py-2.5">
                  <p className="text-xs font-medium leading-tight">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(e.colleges as any)?.code} · {formatDate(e.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending approvals */}
      {(pendingColleges || 0) > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">{pendingColleges} college{(pendingColleges || 0) > 1 ? 's' : ''} awaiting approval</p>
                <p className="text-sm text-yellow-700">Review and approve partnership applications</p>
              </div>
            </div>
            <Link href="/admin/colleges?status=pending" className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Review Now
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
