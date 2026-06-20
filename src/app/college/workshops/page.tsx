import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, getStatusBadge } from '@/lib/utils'
import { WorkshopRequestForm } from './WorkshopRequestForm'
import { Wrench, ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TOPICS = [
  'Data Structures & Algorithms', 'System Design', 'Machine Learning Basics',
  'Web Development', 'Cloud Computing (AWS/GCP)', 'DevOps & CI/CD',
  'Interview Preparation', 'Resume & Soft Skills', 'Hackathon Training',
  'Cybersecurity Fundamentals', 'Database Design', 'Mobile App Development',
]

export default async function WorkshopsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string

  // Fetch existing requests — graceful if table doesn't exist
  const { data: requests } = await supabase
    .from('workshop_requests')
    .select('*')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="flex items-center gap-2"><Wrench className="h-6 w-6 text-primary" /> Workshop Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Request workshops, hackathons, and specialized training sessions from Skill Tank
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Request form */}
        <div className="lg:col-span-2">
          <WorkshopRequestForm collegeId={collegeId} topics={TOPICS} />
        </div>

        {/* Request history */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h3>Your Requests</h3>
              <span className="text-xs text-muted-foreground ml-auto">{requests?.length || 0} total</span>
            </div>
            {(requests?.length || 0) > 0 ? (
              <div className="divide-y">
                {requests!.map((r: any) => (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{r.kind === 'hackathon' ? '⚡' : '🎓'} {r.topic}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {r.kind.charAt(0).toUpperCase() + r.kind.slice(1)} · Preferred: {r.preferred_date ? new Date(r.preferred_date).toLocaleDateString('en-IN') : 'Flexible'}
                        </p>
                        {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.notes}</p>}
                      </div>
                      <span className={getStatusBadge(r.status)}>{r.status}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{formatDate(r.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium">No requests yet</p>
                <p className="text-xs text-muted-foreground mt-1">Submit your first workshop request to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
