import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/admin/fix-realism
// Spreads readiness 35-98 (CGPA-weighted), risk 15/30/55%, cohort completion
export async function POST() {
  const supabase = createServiceClient()

  // 1. Fetch all students
  const { data: students, error: fetchErr } = await supabase
    .from('students')
    .select('id, cgpa')

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  // 2. Compute realistic scores
  const updates = (students || []).map(s => {
    const cgpa = Number(s.cgpa) || 7.5
    const base = ((cgpa - 6.0) / (9.8 - 6.0)) * 63 + 35
    const noise = (Math.random() * 14) - 7
    const readiness_score = Math.max(35, Math.min(98, Math.round(base + noise)))

    const rng = Math.random()
    let risk_level: string
    if (cgpa < 7.0) {
      risk_level = rng < 0.8 ? 'high' : 'medium'
    } else if (cgpa < 7.5) {
      risk_level = rng < 0.5 ? 'high' : rng < 0.8 ? 'medium' : 'low'
    } else if (cgpa < 8.0) {
      risk_level = rng < 0.2 ? 'high' : rng < 0.6 ? 'medium' : 'low'
    } else if (cgpa < 8.5) {
      risk_level = rng < 0.05 ? 'high' : rng < 0.35 ? 'medium' : 'low'
    } else {
      risk_level = rng < 0.02 ? 'high' : rng < 0.15 ? 'medium' : 'low'
    }

    return { id: s.id, readiness_score, risk_level }
  })

  // 3. Batch upsert in chunks of 200 (single API call per chunk)
  const CHUNK = 200
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK)
    const { error: upsertErr } = await supabase
      .from('students')
      .upsert(chunk, { onConflict: 'id' })
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  // 4. Fix cohort completion rates
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, status, completion_pct')
    .or('completion_pct.eq.0,completion_pct.is.null')

  const cohortUpdates = (cohorts || []).map(c => {
    let completion_pct: number
    if (c.status === 'completed') {
      completion_pct = Math.round(88 + Math.random() * 12)
    } else if (c.status === 'in_progress') {
      completion_pct = Math.round(25 + Math.random() * 60)
    } else {
      completion_pct = Math.round(Math.random() * 20)
    }
    return { id: c.id, completion_pct }
  })

  if (cohortUpdates.length > 0) {
    await supabase.from('cohorts').upsert(cohortUpdates, { onConflict: 'id' })
  }

  // 5. Verification stats
  const total = updates.length
  const high = updates.filter(s => s.risk_level === 'high').length
  const medium = updates.filter(s => s.risk_level === 'medium').length
  const low = updates.filter(s => s.risk_level === 'low').length
  const avgReadiness = total
    ? Math.round(updates.reduce((a, s) => a + s.readiness_score, 0) / total)
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
