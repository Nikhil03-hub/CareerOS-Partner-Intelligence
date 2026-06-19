import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { reportId, collegeId, reportType } = await req.json()
    if (!reportId || !collegeId || !reportType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const [college, placements, students, mou, cohorts, revShare, fdp, comms] = await Promise.all([
      supabase.from('colleges').select('name, code, city, state, type, health_score').eq('id', collegeId).single(),
      supabase.from('year_summaries').select('*').eq('college_id', collegeId).order('academic_year', { ascending: false }).limit(6),
      supabase.from('students').select('placement_status, risk_level, readiness_score, cgpa').eq('college_id', collegeId),
      supabase.from('mous').select('title, status, expiry_date, revenue_share_pct, seats_purchased').eq('college_id', collegeId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('cohorts').select('name, enrolled_count, completion_pct, status').eq('college_id', collegeId).order('created_at', { ascending: false }).limit(8),
      supabase.from('revenue_share').select('period, gross_amount, share_amount, payout_status').eq('college_id', collegeId).order('period', { ascending: false }).limit(6),
      supabase.from('fdp_sessions').select('title, date, status, registered_count').eq('college_id', collegeId).order('date', { ascending: false }).limit(5),
      supabase.from('communication_logs').select('type, subject, created_at').eq('college_id', collegeId).order('created_at', { ascending: false }).limit(5),
    ])

    const stuList = students.data || []
    const cohortList = cohorts.data || []
    const revList = revShare.data || []

    const placed = stuList.filter(s => s.placement_status === 'placed').length
    const highRisk = stuList.filter(s => s.risk_level === 'high').length
    const placementRate = stuList.length ? Math.round((placed / stuList.length) * 100) : 0
    const avgReadiness = stuList.length
      ? Math.round(stuList.reduce((a, s) => a + (s.readiness_score || 0), 0) / stuList.length)
      : 0
    const avgCgpa = stuList.length
      ? (stuList.reduce((a, s) => a + (Number(s.cgpa) || 0), 0) / stuList.length).toFixed(2)
      : '0'
    const totalRevShare = revList.reduce((a, r) => a + (r.share_amount || 0), 0)
    const activeCohorts = cohortList.filter(c => c.status !== 'upcoming')
    const avgCompletion = activeCohorts.length > 0
      ? Math.round(activeCohorts.reduce((a, c) => a + (c.completion_pct || 0), 0) / activeCohorts.length)
      : 0

    const metrics = {
      students: {
        total: stuList.length,
        placed,
        placementRate,
        avgReadiness,
        highRisk,
        avgCgpa,
      },
      training: {
        cohorts: cohortList.length,
        avgCompletion,
      },
      revenue: {
        total: totalRevShare,
        periods: revList.length,
      },
    }

    // AI executive summary (rule-based)
    const collegeName = college.data?.name || 'the college'
    const aiSummary = [
      `CareerOS Partner Intelligence — ${reportType.toUpperCase()} REPORT`,
      `${collegeName} | Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      `EXECUTIVE OVERVIEW`,
      `${collegeName} currently has ${stuList.length} enrolled students with a placement rate of ${placementRate}%. ` +
      `Average student readiness score stands at ${avgReadiness}%, with ${highRisk} students classified as high placement risk. ` +
      `Training completion across ${activeCohorts.length} active cohorts averages ${avgCompletion}%. ` +
      `Total revenue share accrued: ₹${(totalRevShare / 100000).toFixed(2)}L.`,
      '',
      placementRate >= 80
        ? `STRENGTH: Excellent placement rate (${placementRate}%) exceeds the 80% benchmark.`
        : placementRate >= 60
          ? `IMPROVEMENT NEEDED: Placement rate (${placementRate}%) is below the 80% target.`
          : `CRITICAL: Placement rate (${placementRate}%) requires immediate intervention.`,
      highRisk > 20
        ? `RISK ALERT: ${highRisk} high-risk students require counselling intervention.`
        : `RISK STATUS: Student risk distribution is within acceptable range.`,
      avgCompletion < 60
        ? `TRAINING GAP: Average cohort completion (${avgCompletion}%) needs improvement.`
        : `TRAINING: Cohort completion rates are on track.`,
    ].join('\n')

    // Update report record
    await supabase.from('reports').update({
      status: 'ready',
      ai_summary: aiSummary,
    }).eq('id', reportId)

    return NextResponse.json({
      success: true,
      data: {
        college: college.data,
        yearSummaries: placements.data,
        metrics,
        cohorts: cohortList,
        revShare: revList,
        fdp: fdp.data,
        comms: comms.data,
        mou: mou.data,
        aiSummary,
        reportType,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
