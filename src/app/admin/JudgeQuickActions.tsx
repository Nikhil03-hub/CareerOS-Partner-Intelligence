import Link from 'next/link'
import { Sparkles, Users, BarChart3, FileText, Brain } from 'lucide-react'

// One-click access to the strongest AI features (so judges never hunt).
export function JudgeQuickActions() {
  const actions = [
    { label: 'Student 360° · ATS · AI Interview', href: '/admin/students', icon: Users, hint: 'Open any student' },
    { label: 'College Leaderboard', href: '/admin/analytics', icon: BarChart3, hint: 'AI health ranking' },
    { label: 'Placement Analytics', href: '/admin/placements', icon: Brain, hint: '9-year KMIT data' },
    { label: 'AI Reports (PDF)', href: '/admin/reports', icon: FileText, hint: 'AI executive summary' },
  ]
  return (
    <div className="rounded-xl border bg-card">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Explore AI Features</h3>
        <span className="text-xs text-muted-foreground ml-auto">judge quick-start</span>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map(a => (
          <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 hover:border-primary/40 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <a.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">{a.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{a.hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
