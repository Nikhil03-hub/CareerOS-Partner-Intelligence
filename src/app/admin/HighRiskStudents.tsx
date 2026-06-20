import { createServiceClient } from '@/lib/supabase/server'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Self-contained — lists the lowest-readiness high-risk students (live from DB).
export async function HighRiskStudents() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('students')
    .select('id, name, readiness_score, risk_level, colleges(code)')
    .eq('risk_level', 'high')
    .order('readiness_score', { ascending: true })
    .limit(6)

  const students = data || []
  if (students.length === 0) return null

  return (
    <div className="rounded-xl border bg-card">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <h3 className="font-semibold">Students Requiring Attention</h3>
        <span className="text-xs text-muted-foreground ml-auto">lowest readiness · click to view</span>
      </div>
      <div className="divide-y">
        {students.map(s => {
          const r = s.readiness_score || 0
          return (
            <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{(s.colleges as any)?.code || '—'} · high risk</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${r}%` }} />
                </div>
                <span className="text-sm font-bold text-red-600 w-10 text-right">{r}%</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
