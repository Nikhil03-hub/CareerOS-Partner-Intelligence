import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'
import { YearSelector } from '@/components/shared/YearSelector'

export const dynamic = 'force-dynamic'

export default async function PlacementsPage({ searchParams }: { searchParams: { year?: string; tab?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const collegeId = user.user_metadata?.college_id as string
  const selectedYear = searchParams.year || '2025-26'
  const activeTab = searchParams.tab || 'records'

  const [records, summaries, allYears, allRecords] = await Promise.all([
    supabase.from('placement_records')
      .select('company, selects, ctc_lpa, academic_year, source')
      .eq('college_id', collegeId)
      .eq('academic_year', selectedYear)
      .order('ctc_lpa', { ascending: false }),
    supabase.from('year_summaries')
      .select('*')
      .eq('college_id', collegeId)
      .order('academic_year', { ascending: false }),
    supabase.from('year_summaries').select('academic_year').eq('college_id', collegeId).order('academic_year', { ascending: false }),
    // For recruiters tab: all records to aggregate by company
    supabase.from('placement_records')
      .select('company, selects, ctc_lpa, academic_year, source')
      .eq('college_id', collegeId)
      .order('academic_year', { ascending: false }),
  ])

  const currentSummary = summaries.data?.find(s => s.academic_year === selectedYear)

  // Build recruiter view: aggregate by company across all years
  const recruiterMap = new Map<string, { hires: number; years: Set<string>; maxLpa: number; source: string }>()
  for (const r of (allRecords.data || [])) {
    const existing = recruiterMap.get(r.company)
    if (existing) {
      existing.hires += r.selects || 0
      existing.years.add(r.academic_year)
      existing.maxLpa = Math.max(existing.maxLpa, r.ctc_lpa || 0)
    } else {
      recruiterMap.set(r.company, {
        hires: r.selects || 0,
        years: new Set([r.academic_year]),
        maxLpa: r.ctc_lpa || 0,
        source: r.source || 'direct',
      })
    }
  }
  const recruiters = Array.from(recruiterMap.entries())
    .map(([company, d]) => ({ company, hires: d.hires, yearsCount: d.years.size, maxLpa: d.maxLpa, source: d.source, years: Array.from(d.years).sort().reverse() }))
    .sort((a, b) => b.hires - a.hires)

  const TABS = [
    { key: 'records', label: 'Year-wise Records' },
    { key: 'recruiters', label: `Recruiters (${recruiters.length})` },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Placement Records</h1>
          <p className="text-muted-foreground text-sm mt-1">Company-wise breakdown by academic year</p>
        </div>
        <YearSelector
          years={(allYears.data || []).map(y => y.academic_year)}
          selectedYear={selectedYear}
          basePath="/college/placements"
          extraParams={activeTab !== 'records' ? { tab: activeTab } : {}}
        />
      </div>

      {/* Year summary */}
      {currentSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Companies', value: currentSummary.companies },
            { label: 'Total Offers', value: currentSummary.offers },
            { label: 'Avg Package', value: `₹${currentSummary.avg_lpa?.toFixed(2)} LPA` },
            { label: 'Top Package', value: `₹${currentSummary.top_offer_lpa} LPA` },
            { label: 'Top Company', value: currentSummary.top_company },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map(tab => (
          <a
            key={tab.key}
            href={`/college/placements?year=${selectedYear}&tab=${tab.key}`}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {activeTab === 'records' && (
        <>
          {/* Year-on-year trend table */}
          <div className="rounded-xl border bg-card overflow-auto">
            <div className="px-5 py-4 border-b">
              <h3>Year-on-Year Placement Trend</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Companies</th>
                  <th>Offers</th>
                  <th>Avg LPA</th>
                  <th>Top LPA</th>
                  <th>Top Company</th>
                </tr>
              </thead>
              <tbody>
                {summaries.data?.map(s => (
                  <tr key={s.academic_year} className={cn('hover:bg-muted/30', s.academic_year === selectedYear ? 'bg-primary/5' : '')}>
                    <td className="font-medium">{s.academic_year}</td>
                    <td>{s.companies}</td>
                    <td className="font-semibold">{s.offers}</td>
                    <td className="text-green-600 font-semibold">₹{s.avg_lpa?.toFixed(2)}L</td>
                    <td className="text-green-600 font-bold">₹{s.top_offer_lpa}L</td>
                    <td>{s.top_company}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Company breakdown for selected year */}
          <div className="rounded-xl border bg-card overflow-auto">
            <div className="px-5 py-4 border-b">
              <h3>Company Breakdown — {selectedYear}</h3>
              <p className="text-xs text-muted-foreground mt-1">{records.data?.length || 0} companies recruited</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company</th>
                  <th>Students Selected</th>
                  <th>CTC (LPA)</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {records.data?.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="text-muted-foreground text-sm">{i + 1}</td>
                    <td className="font-medium text-sm">{r.company}</td>
                    <td className="text-sm">{r.selects}</td>
                    <td className="text-green-600 font-semibold text-sm">₹{r.ctc_lpa}</td>
                    <td>
                      <span className={cn('badge text-xs', r.source === 'promtal' ? 'badge-blue' : 'badge-gray')}>
                        {r.source || 'direct'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(records.data?.length || 0) === 0 && (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">No records for {selectedYear}</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'recruiters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3>Recurring Recruiters</h3>
              <p className="text-xs text-muted-foreground mt-1">Companies that hired from your campus across all years</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="badge badge-blue">promtal</span>
              <span className="text-muted-foreground">= via CareerOS × Promtal integration</span>
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company</th>
                  <th>Total Hires</th>
                  <th>Years Active</th>
                  <th>Top CTC</th>
                  <th>Last Visited Years</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map((r, i) => (
                  <tr key={r.company} className={cn('hover:bg-muted/30', i < 3 ? 'bg-primary/5' : '')}>
                    <td className="text-sm">
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                    </td>
                    <td>
                      <p className="font-semibold text-sm">{r.company}</p>
                      {r.yearsCount >= 3 && (
                        <p className="text-xs text-green-600 font-medium">Repeat recruiter ↑</p>
                      )}
                    </td>
                    <td className="text-sm font-bold">{r.hires}</td>
                    <td className="text-sm">{r.yearsCount} yr{r.yearsCount !== 1 ? 's' : ''}</td>
                    <td className="text-green-600 font-semibold text-sm">₹{r.maxLpa}L</td>
                    <td className="text-xs text-muted-foreground">{r.years.slice(0, 3).join(', ')}</td>
                    <td>
                      <span className={cn('badge text-xs', r.source === 'promtal' ? 'badge-blue' : 'badge-gray')}>
                        {r.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recruiters.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">No placement records yet</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-right italic">
            Data includes CareerOS direct + Promtal integration placements
          </p>
        </div>
      )}
    </div>
  )
}
