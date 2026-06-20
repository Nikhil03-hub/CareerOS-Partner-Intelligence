import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { collegeId } = await req.json()
    if (!collegeId) return NextResponse.json({ error: 'Missing collegeId' }, { status: 400 })

    const supabase = createServiceClient()

    // Fetch data for AI summary
    const [collegeRes, studentsRes, placementsRes, enrollmentsRes, fdpRes] = await Promise.all([
      supabase.from('colleges').select('name, health_score, city').eq('id', collegeId).single(),
      supabase.from('students').select('placement_status, risk_level, readiness_score').eq('college_id', collegeId),
      supabase.from('placements').select('package_lpa, status, company_name').eq('college_id', collegeId).eq('status', 'accepted'),
      supabase.from('enrollments').select('status, progress_pct').eq('college_id', collegeId),
      supabase.from('fdp_sessions').select('status, attendance_pct').eq('college_id', collegeId),
    ])

    const college = collegeRes.data
    const students = studentsRes.data || []
    const placements = placementsRes.data || []
    const enrollments = enrollmentsRes.data || []
    const fdpSessions = fdpRes.data || []

    // Compute stats
    const totalStudents = students.length
    const placed = students.filter(s => s.placement_status === 'placed' || s.placement_status === 'offer_accepted').length
    const placementPct = totalStudents > 0 ? Math.round((placed / totalStudents) * 100) : 0
    const highRisk = students.filter(s => s.risk_level === 'high').length
    const avgReadiness = totalStudents > 0
      ? Math.round(students.reduce((a, s) => a + (s.readiness_score || 0), 0) / totalStudents)
      : 0
    const avgPackage = placements.length > 0
      ? parseFloat((placements.reduce((a, p) => a + (p.package_lpa || 0), 0) / placements.length).toFixed(2))
      : 0
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length
    const completionRate = enrollments.length > 0
      ? Math.round((completedEnrollments / enrollments.length) * 100)
      : 0
    const avgFdpAttendance = fdpSessions.length > 0
      ? Math.round(fdpSessions.reduce((a, f) => a + (f.attendance_pct || 0), 0) / fdpSessions.length)
      : 0

    // Generate AI executive summary (rule-based)
    const summaryParts: string[] = []
    summaryParts.push(`${college?.name || 'Your college'} digest for ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.`)

    if (placementPct >= 70) {
      summaryParts.push(`Placement performance is strong at ${placementPct}% (${placed}/${totalStudents} students placed).`)
    } else if (placementPct >= 50) {
      summaryParts.push(`Placement rate stands at ${placementPct}% — moderate; ${totalStudents - placed} students still require active placement support.`)
    } else {
      summaryParts.push(`Placement rate is ${placementPct}% — below target. Immediate intervention recommended for ${totalStudents - placed} unplaced students.`)
    }

    if (avgPackage > 0) {
      summaryParts.push(`Average package across ${placements.length} offers: ₹${avgPackage}L.`)
    }

    if (completionRate >= 80) {
      summaryParts.push(`Training completion rate is excellent at ${completionRate}%.`)
    } else if (completionRate > 0) {
      summaryParts.push(`Training completion at ${completionRate}% — consider targeted follow-up sessions.`)
    }

    if (highRisk > 0) {
      summaryParts.push(`${highRisk} high-risk student${highRisk !== 1 ? 's' : ''} identified — schedule immediate mentoring sessions.`)
    }

    if (avgFdpAttendance > 0) {
      summaryParts.push(avgFdpAttendance >= 75
        ? `FDP attendance is healthy at ${avgFdpAttendance}%.`
        : `FDP attendance at ${avgFdpAttendance}% — recommend faculty re-engagement.`
      )
    }

    // Recommendation
    if (highRisk > 5) {
      summaryParts.push('Recommended action: enroll high-risk students in Interview Master and mock interview cohorts immediately.')
    } else if (placementPct < 60) {
      summaryParts.push('Recommended action: intensify campus drive outreach and partner with more companies for placement opportunities.')
    } else {
      summaryParts.push('College is on a positive trajectory. Focus on converting medium-risk students to placed status.')
    }

    const summary = summaryParts.join(' ')

    // Save as a report record
    const reportTitle = `Monthly Digest – ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
    const { data: report } = await supabase.from('reports').insert({
      college_id: collegeId,
      title: reportTitle,
      type: 'digest',
      status: 'ready',
      ai_summary: summary,
      metadata: {
        placement_pct: placementPct,
        placed_count: placed,
        total_students: totalStudents,
        avg_package: avgPackage,
        completion_rate: completionRate,
        high_risk_count: highRisk,
        avg_readiness: avgReadiness,
        generated_at: new Date().toISOString(),
      },
    }).select().single()

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'digest_ready',
      title: 'Monthly Digest Ready',
      message: `Your ${reportTitle} has been generated. ${placed} students placed (${placementPct}%).`,
      is_read: false,
      link: '/college/reports',
    }).single()

    // Log activity
    await supabase.from('activity_events').insert({
      event_type: 'report.digest',
      entity_type: 'college',
      entity_id: collegeId,
      payload: { title: reportTitle, placement_pct: placementPct },
    }).single()

    revalidatePath('/college/reports')
    revalidatePath('/college/notifications')

    return NextResponse.json({ success: true, summary, reportId: report?.id })
  } catch (err: any) {
    console.error('[digest]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
