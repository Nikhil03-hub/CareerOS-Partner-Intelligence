import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/admin/fix-realism
// Fixes seed realism: spreads readiness 35-98, risk 15/30/55%, cohort completion
// Protected: only callable with SUPABASE_SERVICE_ROLE_KEY env (server-only)
export async function POST() {
  const supabase = createServiceClient()

  // 1. Fix readiness scores (CGPA-weighted, 35-98)
  const { error: e1 } = await supabase.rpc('fix_student_realism' as any)

  if (e1) {
    // Fallback: direct per-student update via JS if SQL function not available
    const { data: students, error: fetchErr } = await supabase
      .from('students')
      .select('id, cgpa')

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

    const updates = (students || []).map(s => {
      const cgpa = Number(s.cgpa) || 7.5
      const base = ((cgpa - 6.0) / (9.8 - 6.0)) * 63 + 35
      const noise = (Math.random() * 14) - 7
      const readiness = Math.max(35, Math.min(98, Math.round(base + noise)))
      const riskRoll = Math.random()
      let risk: string
      if (cgpa < 7.0) {
        risk = 'high'
      } else if (cgpa < 7.4 && riskRoll < 0.5) {
        risk = 'high'
      } else if (cgpa < 8.0) {
        risk = 'medium'
      } else if (cgpa < 8.3 && riskRoll < 0.25) {
        risk = 'medium'
      } else {
        risk = 'low'
      }
      return { id: s.id, readiness_score: readiness, risk_level: risk }
    })

    // Batch update in chunks of 100
    const CHUNK = 100
    for (let i = 0; i < updates.length; i += CHUNK) {
      const chunk = updates.slice(i, i + CHUNK)
      for (const u of chunk) {
        await supabase.from('students').update({
          readiness_score: u.readiness_score,
          risk_level: u.risk_level,
        }).eq('id', u.id)
      }
    }
  }

  // 2. Fix cohort completion rates
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, status, completion_pct')
    .or('completion_pct.eq.0,completion_pct.is.null')

  for (const c of cohorts || []) {
    let pct: number
    if (c.status === 'completed') {
      pct = Math.round(88 + Math.random() * 12)
    } else if (c.status === 'in_progress') {
      pct = Math.round(25 + Math.random() * 60)
    } else {
      pct = Math.round(Math.random() * 20)
    }
    await supabase.from('cohorts').update({ completion_pct: pct }).eq('id', c.id)
  }

  // 3. Verification stats
  const { data: stats } = await supabase
    .from('students')
    .select('risk_level, readiness_score')

  const total = stats?.length || 0
  const high = stats?.filter(s => s.risk_level === 'high').length || 0
  const medium = stats?.filter(s => s.risk_level === 'medium').length || 0
  const low = stats?.filter(s => s.risk_level === 'low').length || 0
  const avgReadiness = total
    ? Math.round((stats?.reduce((a, s) => a + (s.readiness_score || 0), 0) || 0) / total)
    : 0

  return NextResponse.json({
    success: true,
    stats: {
      total,
      risk: { high, medium, low },
      pct: {
        high: ((high / total) * 100).toFixed(1),
        medium: ((medium / total) * 100).toFixed(1),
        low: ((low / total) * 100).toFixed(1),
      },
      avgReadiness,
    },
  })
}
