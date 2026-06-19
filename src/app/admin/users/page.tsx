import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  const { data: users } = await supabase.from('users')
    .select('id, name, email, phone, role, status, created_at, colleges(name, code)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>RBAC — Users & Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">{users?.length || 0} users · Role-based access control</p>
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
            {users?.map(u => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="font-medium text-sm">{u.name}</td>
                <td className="text-sm text-muted-foreground">{u.email}</td>
                <td>
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td className="text-sm">{(u.colleges as any)?.code || '—'}</td>
                <td><span className={getStatusBadge(u.status)}>{u.status}</span></td>
                <td className="text-xs text-muted-foreground">{formatDate(u.created_at)}</td>
                <td>
                  <ToggleStatusButton userId={u.id} currentStatus={u.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
