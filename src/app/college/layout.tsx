import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserMenu } from '@/components/shared/UserMenu'
import {
  LayoutDashboard, Users, TrendingUp, BookOpen,
  FileText, DollarSign, Bell, BarChart3, Award, MessageSquare, LineChart
} from 'lucide-react'

const COLLEGE_NAV = [
  { label: 'Dashboard', href: '/college/dashboard', icon: LayoutDashboard, roles: ['tpo', 'hod', 'faculty_coord', 'club_coord'] },
  { label: 'Students', href: '/college/students', icon: Users, roles: ['tpo', 'hod', 'faculty_coord', 'club_coord'] },
  { label: 'Placements', href: '/college/placements', icon: TrendingUp, roles: ['tpo', 'hod', 'club_coord'] },
  { label: 'Training', href: '/college/training', icon: BookOpen, roles: ['tpo', 'hod', 'faculty_coord'] },
  { label: 'FDP', href: '/college/fdp', icon: Award, roles: ['tpo', 'faculty_coord'] },
  { label: 'MOU', href: '/college/mou', icon: FileText, roles: ['tpo'] },
  { label: 'Revenue', href: '/college/revenue', icon: DollarSign, roles: ['tpo'] },
  { label: 'Benchmarking', href: '/college/benchmarking', icon: LineChart, roles: ['tpo', 'hod'] },
  { label: 'Reports', href: '/college/reports', icon: BarChart3, roles: ['tpo', 'hod'] },
  { label: 'Communications', href: '/college/comms', icon: MessageSquare, roles: ['tpo'] },
  { label: 'Notifications', href: '/college/notifications', icon: Bell, roles: ['tpo', 'hod', 'faculty_coord', 'club_coord'] },
]

export default async function CollegeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const role = user.user_metadata?.role as string
  const COLLEGE_ROLES = ['tpo', 'hod', 'faculty_coord', 'club_coord']
  if (!COLLEGE_ROLES.includes(role)) redirect('/admin')

  const { data: profile } = await supabase.from('users')
    .select('name, email, college:colleges(name, code)')
    .eq('auth_id', user.id).single()

  const visibleNav = COLLEGE_NAV.filter(n => n.roles.includes(role))

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 border-r bg-card shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">C</div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none truncate">CareerOS</p>
            <p className="text-xs text-muted-foreground truncate">{(profile?.college as any)?.name || 'College Portal'}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {visibleNav.map(item => (
            <Link key={item.href} href={item.href} className="sidebar-link">
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-3">
          <UserMenu
            name={profile?.name || user.email || ''}
            email={profile?.email || user.email || ''}
            role={role}
          />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
