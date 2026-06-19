import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, roll_no, college_id, cgpa, batch_year, placement_status, gender } = body

  if (!name || !email || !college_id) {
    return NextResponse.json({ error: 'name, email, college_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const cg = Number(cgpa) || 7.5
  const readiness = Math.max(35, Math.min(98, Math.round((cg - 6.0) / (9.8 - 6.0) * 63 + 35)))
  const risk: string = cg < 7.0 ? 'high' : cg < 8.0 ? 'medium' : 'low'

  const { data, error } = await supabase.from('students').insert({
    name, email, phone, roll_no, college_id,
    cgpa: cg,
    batch_year: Number(batch_year) || 2023,
    placement_status: placement_status || 'unplaced',
    gender: gender || 'Male',
    readiness_score: readiness,
    risk_level: risk,
    ats_score: 0,
    skills: [],
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_events').insert({
    college_id,
    entity_type: 'student',
    entity_id: data.id,
    event_type: 'student.added',
    title: `New student added: ${name}`,
    payload: { email, cgpa: cg, placement_status },
  })

  return NextResponse.json({ success: true, studentId: data.id })
}
