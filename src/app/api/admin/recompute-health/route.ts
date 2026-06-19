import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeCollegeHealthScore } from '@/lib/ai/score'

// POST /api/admin/recompute-health
// Batch-recomputes College Health Score for ALL approved colleges.
// Writes back to colleges.health_score so leaderboard/dashboard show live values.
export async function POST() {
  const supabase = createServiceClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000).toISOString()
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 86400_000).toISOString()

  // 1. Get all colleges
  const { data: colleges, error: colErr } = await supabase
    .from('colleges')
    .select('id, name, code, seats_purchased')
    .in('status', ['active', 'approved'])

  if (colErr || !colleges) {
    return NextResponse.json({ error: colErr?.message || 'No colleges found' }, { status: 500 })
  }

  const results: { id: string; name: string; score: number; grade: string }[] = []
  let errors = 0

  for (const college of colleges) {
    try {
      const [
        { data: students },
        { data: cohorts },
        { count: commCount },
        { data: mous },
        { count: fdpCount },
        { data: revenue },
      ] = await Promise.all([
        supabase.from('students').select('id, placement_status').eq('college_id', college.id),
        supabase.from('cohorts').select('completion_pct, status').eq('college_id', college.id),
        supabase.from('communication_logs')
          .select('id', { count: 'exact', head: true })
          .eq('college_id', college.id)
          .gte('created_at', thirtyDaysAgo),
        supabase.from('mous').select('status, expiry_date')
          .eq('college_id', college.id)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase.from('fdp_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('college_id', college.id)
          .gte('date', twelveMonthsAgo),
        supabase.from('revenue_share').select('share_amount').eq('college_id', college.id),
      ])

      const totalStudents = students?.length || 0
      const placedStudents = students?.filter(s => s.placement_status === 'placed').length || 0

      const latestMOU = mous?.[0]
      let mouStatus: 'active' | 'expiring' | 'expired' | 'none' = 'none'
      if (latestMOU) {
        if (latestMOU.status === 'expired') mouStatus = 'expired'
        else if (latestMOU.status === 'expiring') mouStatus = 'expiring'
        else mouStatus = 'active'
      }

      const revenueThisYear = (revenue || []).reduce((a, r) => a + (r.share_amount || 0), 0)
      const AVG_FEE_PER_SEAT = 25000
      const revenueExpected = (college.seats_purchased || 0) * AVG_FEE_PER_SEAT

      const inputs = {
        totalStudents,
        placedStudents,
        cohorts: (cohorts || []).map(c => ({ completion_pct: c.completion_pct || 0, status: c.status })),
        commLogsLast30Days: commCount || 0,
        mouStatus,
        fdpSessionsLast12Months: fdpCount || 0,
        revenueThisYear,
        revenueExpected,
      }

      const result = computeCollegeHealthScore(inputs)

      // Write back to colleges table (for leaderboard/dashboard list views)
      await supabase
        .from('colleges')
        .update({ health_score: result.score })
        .eq('id', college.id)

      // Store history snapshot
      await supabase.from('college_health_history').insert({
        college_id: college.id,
        score: result.score,
        breakdown: result.factors.reduce((acc: Record<string, number>, f) => {
          acc[f.label] = f.value
          return acc
        }, {}),
      })

      // Cache in ai_insights (bust previous)
      await supabase.from('ai_insights').insert({
        scope_type: 'college',
        scope_id: college.id,
        college_id: college.id,
        type: 'health_score',
        score: result.score,
        label: result.label,
        model: 'rule_based',
        reasons: { grade: result.grade, factors: result.factors, inputs } as unknown,
        generated_at: now.toISOString(),
      })

      results.push({ id: college.id, name: college.name, score: result.score, grade: result.grade })
    } catch {
      errors++
    }
  }

  // Log activity
  await supabase.from('activity_events').insert({
    entity_type: 'system',
    action: 'health_scores.batch_recomputed',
    description: `Batch-recomputed health scores for ${results.length} colleges`,
    metadata: { computed: results.length, errors },
  })

  return NextResponse.json({
    success: true,
    computed: results.length,
    errors,
    results: results.sort((a, b) => b.score - a.score),
  })
}
