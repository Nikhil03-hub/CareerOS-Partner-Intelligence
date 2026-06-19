import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { reportId, collegeId, reportType } = await req.json()
    if (!reportId || !collegeId || !reportType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch data for report
    const [college, placements, students, mou, cohorts, revShare] = await Promise.all([
      supabase.from('colleges').select('name, code, city, type').eq('id', collegeId).single(),
      supabase.from('year_summaries').select('*').eq('college_id', collegeId).order('academic_year', { ascending: false }),
      supabase.from('students').select('placement_status, risk_level, readiness_score').eq('college_id', collegeId),
      supabase.from('mous').select('*').eq('college_id', collegeId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('cohorts').select('name, enrolled_count, completion_pct').eq('college_id', collegeId).limit(5),
      supabase.from('revenue_share').select('period, share_amount, payout_status').eq('college_id', collegeId).order('period', { ascending: false }).limit(4),
    ])

    // Build summary payload
    const stuList = students.data || []
    const cohortList = cohorts.data || []
    const revList = revShare.data || []

    const placed = stuList.filter(s => s.placement_status === 'placed').length
    const placementRate = stuList.length ? Math.round((placed / stuList.length) * 100) : 0
    const totalRevShare = revList.reduce((a, r) => a + (r.share_amount || 0), 0)
    const avgCompletion = cohortList.length
      ? cohortList.reduce((a, c) => a + (c.completion_pct || 0), 0) / cohortList.length
      : 0
    const latestYear = placements.data?.[0]

    const summary = {
      college: college.data?.name,
      reportType, generatedAt: new Date().toISOString(),
      placement: { rate: placementRate, students: stuList.length, placed, latestYear },
      training: { cohorts: cohortList.length, avgCompletion },
      revenue: { total: totalRevShare, mouExpiry: mou.data?.expiry_date },
    }

    // Update report record with summary (PDF generation would happen here with @react-pdf/renderer)
    await supabase.from('reports').update({
      status: 'ready',
      ai_summary: JSON.stringify(summary),
      file_url: null, // In production: upload generated PDF to Supabase Storage
    }).eq('id', reportId)

    // Log activity event
    await supabase.from('activity_events').insert({
      college_id: collegeId, entity_type: 'report', entity_id: reportId,
      event_type: 'report.generated',
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated`,
      payload: { reportType },
    })

    return NextResponse.json({ success: true, summary })
  } catch (err: any) {
    console.error('[report/generate]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
