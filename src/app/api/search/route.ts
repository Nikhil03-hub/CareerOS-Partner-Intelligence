import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const q = req.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json({ results: [] })

    const supabase = createServiceClient()
    const pattern = `%${q}%`
    const role = user.user_metadata?.role
    const collegeId = user.user_metadata?.college_id

    const isAdmin = role === 'super_admin' || role === 'account_manager'

    const [studentsRes, collegesRes, placementsRes, mousRes] = await Promise.all([
      // Students
      supabase.from('students')
        .select('id, name, email, roll_no, college_id, placement_status, colleges(name, code)')
        .or(`name.ilike.${pattern},email.ilike.${pattern},roll_no.ilike.${pattern}`)
        .eq('college_id', isAdmin ? undefined! : collegeId as string)
        .limit(5)
        .then(r => isAdmin ? supabase.from('students')
          .select('id, name, email, roll_no, college_id, placement_status, colleges(name, code)')
          .or(`name.ilike.${pattern},email.ilike.${pattern},roll_no.ilike.${pattern}`)
          .limit(5) : r),
      // Colleges (admin only)
      isAdmin ? supabase.from('colleges')
        .select('id, name, code, city, health_score')
        .or(`name.ilike.${pattern},code.ilike.${pattern},city.ilike.${pattern}`)
        .limit(5) : Promise.resolve({ data: [] }),
      // Placements
      supabase.from('placements')
        .select('id, student_name, company_name, role, package_lpa, college_id')
        .or(`student_name.ilike.${pattern},company_name.ilike.${pattern},role.ilike.${pattern}`)
        .eq('college_id', isAdmin ? undefined! : collegeId as string)
        .limit(5)
        .then(r => isAdmin ? supabase.from('placements')
          .select('id, student_name, company_name, role, package_lpa')
          .or(`student_name.ilike.${pattern},company_name.ilike.${pattern},role.ilike.${pattern}`)
          .limit(5) : r),
      // MOUs (admin only)
      isAdmin ? supabase.from('mous')
        .select('id, title, status, colleges(name, code)')
        .or(`title.ilike.${pattern}`)
        .limit(4) : Promise.resolve({ data: [] }),
    ])

    const results: Array<{
      type: string; id: string; title: string; subtitle?: string; href: string
    }> = []

    ;(studentsRes.data || []).forEach((s: any) => {
      results.push({
        type: 'student',
        id: s.id,
        title: s.name,
        subtitle: `${(s.colleges as any)?.code || ''} · ${s.roll_no || s.email}`,
        href: isAdmin ? `/admin/students` : `/college/students/${s.id}`,
      })
    })

    ;(collegesRes.data || []).forEach((c: any) => {
      results.push({
        type: 'college',
        id: c.id,
        title: c.name,
        subtitle: `${c.code} · ${c.city || ''} · Health: ${c.health_score || '—'}`,
        href: `/admin/colleges/${c.id}`,
      })
    })

    ;(placementsRes.data || []).forEach((p: any) => {
      results.push({
        type: 'placement',
        id: p.id,
        title: `${p.student_name} → ${p.company_name}`,
        subtitle: `${p.role || ''} · ₹${p.package_lpa || 0}L`,
        href: isAdmin ? `/admin/placements` : `/college/placements`,
      })
    })

    ;(mousRes.data || []).forEach((m: any) => {
      results.push({
        type: 'mou',
        id: m.id,
        title: m.title,
        subtitle: `${(m.colleges as any)?.name || ''} · ${m.status}`,
        href: `/admin/mous`,
      })
    })

    return NextResponse.json({ results: results.slice(0, 12) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
