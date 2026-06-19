import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserMenu } from '@/components/shared/UserMenu'
import {
  LayoutDashboard, Building2, Users, TrendingUp, BookOpen,
  FileText, DollarSign, Bell, Settings, BarChart3, Shield,
  MessageSquare, Award, LineChart
} from 'lucide-react'

const NAV = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Colleges', href: '/admin/colleges', icon: Building2 },
  { label: 'Students', href: '/admin/students', icon: Users },
  { label: 'Placements', href: '/admin/placements', icon: TrendingUp },
  { label: 'Training', href: '/admin/training', icon: BookOpen },
  { label: 'MOUs', href: '/admin/mous', icon: FileText },
  { label: 'FDP', href: '/admin/fdp', icon: Award },
  { label: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { label: 'Analytics', href: '/admin/analytics', icon: LineChart },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Communications', href: '/admin/comms', icon: MessageSquare },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'RBAC / Users', href: '/admin/users', icon: Shield },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const role = user.user_metadata?.role
  if (role !== 'super_admin' && role !== 'account_manager') redirect('/college/dashboard')

  const { data: profile } = await supabase.from('users').select('name, email').eq('auth_id', user.id).single()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">C</div>
          <div>
            <p className="text-sm font-bold leading-none">CareerOS</p>
            <p className="text-xs text-muted-foreground">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(item => (
            <Link key={item.href} href={item.href} className="sidebar-link">
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-3">
          <UserMenu
            name={profile?.name || user.email || 'Admin'}
            email={profile?.email || user.email || ''}
            role={role}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
