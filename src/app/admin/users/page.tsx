import { createServiceClient } from '@/lib/supabase/server'
import { getStatusBadge, formatDate } from '@/lib/utils'
import { InviteUserButton } from './InviteUserButton'
import { ToggleStatusButton } from './ToggleStatusButton'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  account_manager: 'Account Manager',
  tpo: 'TPO',
  hod: 'HOD',
  faculty_coord: 'Faculty Coordinator',
  club_coord: 'Club Coordinator',
}

export default async function UsersPage() {
  const supabase = createServiceClient()

  const [{ data: users, error: usersError }, { data: colleges, error: collegesError }] = await Promise.all([
    supabase.from('users')
      .select('id, name, email, phone, role, status, created_at, college_id')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('colleges')
      .select('id, name, code'),
  ])

  if (usersError) console.error('[users/page] users query:', usersError)
  if (collegesError) console.error('[users/page] colleges query:', collegesError)

  const collegeMap = new Map((colleges || []).map(c => [c.id, c]))

  return (
    <div className="p-6 space-y-6">
      {usersError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <strong>Data load error:</strong> {usersError.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1>RBAC &mdash; Users &amp; Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {users?.length ?? 0} users &middot; Role-based access control
          </p>
        </div>
        <InviteUserButton />
      </div>

      <div className="rounded-xl border bg-card overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>College</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map(u => {
              const college = u.college_id ? collegeMap.get(u.college_id) : null
              return (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="font-medium text-sm">{u.name}</td>
                  <td className="text-sm text-muted-foreground">{u.email}</td>
                  <td>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="text-sm">{(college as any)?.code || '—'}</td>
                  <td><span className={getStatusBadge(u.status)}>{u.status}</span></td>
                  <td className="text-xs text-muted-foreground">{formatDate(u.created_at)}</td>
                  <td>
                    <ToggleStatusButton userId={u.id} currentStatus={u.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(users?.length ?? 0) === 0 && !usersError && (
          <div className="px-5 py-16 text-center">
            <div className="text-4xl mb-3">\U0001f465</div>
            <p className="font-semibold text-foreground mb-1">No users found</p>
            <p className="text-sm text-muted-foreground">Invite team members and college contacts to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
