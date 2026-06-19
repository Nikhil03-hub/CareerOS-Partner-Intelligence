import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeCollegeHealthScore } from '@/lib/ai/score'

// GET /api/health-score/:collegeId
// Computes college health score from live DB data, caches in ai_insights
export async function GET(
  _req: NextRequest,
  { params }: { params: { collegeId: string } }
) {
  const { collegeId } = params
  const supabase = createServiceClient()

  // 1. Check cache (use if < 24 hours old)
  const { data: cached } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('college_id', collegeId)
    .eq('scope_type', 'college')
    .eq('type', 'health_score')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const cacheAgeHours = cached
    ? (Date.now() - new Date(cached.generated_at).getTime()) / 3_600_000
    : Infinity

  if (cached && cacheAgeHours < 24 && !(_req.nextUrl.searchParams.get('bust'))) {
    const reasons = cached.reasons as Record<string, unknown>
    return NextResponse.json({
      score: cached.score,
      grade: reasons?.grade,
      label: cached.label,
      factors: reasons?.factors || [],
      inputs: reasons?.inputs || {},
      computedAt: cached.generated_at,
      cached: true,
    })
  }

  // 2. Fetch all inputs from live DB
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000).toISOString()
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 86400_000).toISOString()
  const thisYearStart = `${now.getFullYear()}-01-01`

  const [
    { data: college },
    { data: students },
    { data: cohorts },
    { count: commCount },
    { data: mous },
    { count: fdpCount },
    { data: revenue },
  ] = await Promise.all([
    supabase.from('colleges').select('id, name, code, seats_purchased').eq('id', collegeId).single(),
    supabase.from('students').select('id, placement_status').eq('college_id', collegeId),
    supabase.from('cohorts').select('completion_pct, status').eq('college_id', collegeId),
    supabase.from('communication_logs')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', collegeId)
      .gte('created_at', thirtyDaysAgo),
    supabase.from('mous').select('status, expiry_date')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase.from('fdp_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', collegeId)
      .gte('date', twelveMonthsAgo),
    supabase.from('revenue_share').select('share_amount')
      .eq('college_id', collegeId),
  ])

  if (!college) return NextResponse.json({ error: 'College not found' }, { status: 404 })

  // 3. Derive inputs
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

  // 4. Compute score
  const result = computeCollegeHealthScore(inputs)

  // 5. Store in ai_insights (insert new row — read latest always)
  await supabase.from('ai_insights').insert({
    scope_type: 'college',
    scope_id: collegeId,
    college_id: collegeId,
    type: 'health_score',
    score: result.score,
    label: result.label,
    model: 'rule_based',
    reasons: { grade: result.grade, factors: result.factors, inputs } as unknown,
    generated_at: now.toISOString(),
  })

  // 6. Store history snapshot
  await supabase.from('college_health_history').insert({
    college_id: collegeId,
    score: result.score,
    breakdown: result.factors.reduce((acc, f) => ({ ...acc, [f.label]: f.value }), {}),
  })

  // 7. Update colleges.health_score for list view
  await supabase.from('colleges').update({ health_score: result.score }).eq('id', collegeId)

  return NextResponse.json({
    score: result.score,
    grade: result.grade,
    label: result.label,
    factors: result.factors,
    inputs,
    computedAt: now.toISOString(),
    cached: false,
    college_name: college.name,
    college_code: college.code,
  })
}
