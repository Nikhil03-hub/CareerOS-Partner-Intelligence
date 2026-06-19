import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/colleges/list — returns all colleges for dropdowns (service role, bypasses RLS)
export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('colleges')
    .select('id, name, code')
    .order('code')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ colleges: data || [] })
}
