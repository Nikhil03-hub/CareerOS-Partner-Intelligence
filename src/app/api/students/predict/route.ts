import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { predictPlacement } from '@/lib/ai/score'

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('id')
  if (!studentId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: student, error } = await supabase
    .from('students')
    .select('id, name, cgpa, readiness_score, ats_score, risk_level, placement_status, skills, college_id, colleges(name, code)')
    .eq('id', studentId)
    .single()

  if (error || !student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Get training completion from enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('progress_pct, cohorts(name)')
    .eq('student_id', studentId)
    .limit(5)

  const avgTraining = enrollments?.length
    ? Math.round(enrollments.reduce((a, e) => a + (e.progress_pct || 0), 0) / enrollments.length)
    : 50

  // Derive inputs from what we have
  const cgpa = Number(student.cgpa) || 7.5
  const prediction = predictPlacement({
    attendancePct: Math.min(100, Math.max(0, student.readiness_score || 70)),
    trainingCompletionPct: avgTraining,
    assessmentScore: Math.min(100, Math.max(0, (student.ats_score || 0))),
    dsaOrMockScore: Math.min(100, Math.round(cgpa * 9)),
    cgpa,
  })

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      cgpa,
      riskLevel: student.risk_level,
      placementStatus: student.placement_status,
      college: student.colleges,
      skills: student.skills || [],
    },
    prediction,
    enrollments: enrollments || [],
  })
}
