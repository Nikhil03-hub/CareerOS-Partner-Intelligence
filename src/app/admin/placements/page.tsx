import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { YearSelector } from '@/components/shared/YearSelector'

export const dynamic = 'force-dynamic'

export default async function AdminPlacementsPage({ searchParams }: { searchParams: { year?: string } }) {
  const supabase = createServiceClient()
  const selectedYear = searchParams.year || '2025-26'

  const [records, allYears, topCompanies] = await Promise.all([
    supabase.from('year_summaries').select('*, colleges(name, code)').eq('academic_year', selectedYear).order('offers', { ascending: false }),
    supabase.from('year_summaries').select('academic_year').order('academic_year', { ascending: false }),
    supabase.from('placement_records').select('company, selects, ctc_lpa').eq('academic_year', selectedYear).order('ctc_lpa', { ascending: false }).limit(15),
  ])

  const YEARS = [...new Set(allYears.data?.map((y: any) => y.academic_year as string) ?? [])] as string[]
  const totalOffers = records.data?.reduce((a, r) => a + (r.offers || 0), 0) || 0
  const avgPackage = records.data?.length ? records.data.reduce((a, r) => a + (r.avg_lpa || 0), 0) / records.data.length : 0
  const topPackage = Math.max(...(records.data?.map(r => r.top_offer_lpa || 0) || [0]))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Placement Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Cross-college placement data for {selectedYear}</p>
        </div>
        <YearSelector
          years={YEARS}
          selectedYear={selectedYear}
          basePath="/admin/placements"
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card"><p className="stat-label">Total Offers</p><p className="stat-value">{totalOffers.toLocaleString()}</p></div>
        <div className="stat-card"><p className="stat-label">Avg Package</p><p className="stat-value">₹{avgPackage.toFixed(2)}L</p></div>
        <div className="stat-card"><p className="stat-label">Top Package</p><p className="stat-value text-green-600">₹{topPackage}L</p></div>
        <div className="stat-card"><p className="stat-label">Colleges Reporting</p><p className="stat-value">{records.data?.length || 0}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* College leaderboard */}
        <div className="rounded-xl border bg-card overflow-auto">
          <div className="px-5 py-4 border-b"><h3>College Leaderboard — {selectedYear}</h3></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>College</th>
                <th>Offers</th>
                <th>Avg LPA</th>
                <th>Top LPA</th>
              </tr>
            </thead>
            <tbody>
              {records.data?.map((r, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="text-muted-foreground text-sm font-bold">{i + 1}</td>
                  <td>
                    <Link href={`/admin/colleges/${(r.colleges as any)?.id}`} className="font-semibold text-primary hover:underline text-sm">{(r.colleges as any)?.code}</Link>
                  </td>
                  <td className="text-sm font-semibold">{r.offers}</td>
                  <td className="text-sm text-green-600 font-semibold">₹{r.avg_lpa?.toFixed(2)}L</td>
                  <td className="text-sm font-bold text-green-700">₹{r.top_offer_lpa}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top companies */}
        <div className="rounded-xl border bg-card overflow-auto">
          <div className="px-5 py-4 border-b"><h3>Top Hiring Companies — {selectedYear}</h3></div>
          <table className="data-table">
            <thead><tr><th>#</th><th>Company</th><th>Offers</th><th>CTC (LPA)</th></tr></thead>
            <tbody>
              {topCompanies.data?.map((c, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="text-muted-foreground text-sm">{i + 1}</td>
                  <td className="font-medium text-sm">{c.company}</td>
                  <td className="text-sm">{c.selects}</td>
                  <td className="text-green-600 font-semibold text-sm">₹{c.ctc_lpa}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
