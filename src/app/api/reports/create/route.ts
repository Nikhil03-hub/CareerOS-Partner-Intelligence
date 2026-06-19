import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const REPORT_TITLES: Record<string, string> = {
  placement: 'Placement Analytics Report',
  health: 'College Health Score Report',
  quarterly: 'Quarterly Partnership Report',
  revenue: 'Revenue Share Report',
}

export async function POST(req: NextRequest) {
  const { collegeId, reportType } = await req.json()
  if (!collegeId || !reportType) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase.from('reports').insert({
    college_id: collegeId,
    title: REPORT_TITLES[reportType] || `${reportType} Report`,
    type: reportType,
    status: 'processing',
    created_at: new Date().toISOString(),
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reportId: data.id })
}
