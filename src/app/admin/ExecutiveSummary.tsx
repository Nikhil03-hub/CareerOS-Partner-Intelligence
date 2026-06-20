import { createServiceClient } from '@/lib/supabase/server'
import { Sparkles, ArrowUpRight } from 'lucide-react'
import { VoiceSummary } from '@/components/shared/VoiceSummary'

// Self-contained AI Executive Summary — computed live from DB (no props, own query).
export async function ExecutiveSummary() {
  const supabase = createServiceClient()

  const [
    { count: totalColleges },
    { count: totalStudents },
    { count: placedStudents },
    { count: highRisk },
    { data: colleges },
    { count: expiringMous },
    { count: pendingPayouts },
  ] = await Promise.all([
    supabase.from('colleges').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('placement_status', 'placed'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('risk_level', 'high'),
    supabase.from('colleges').select('health_score'),
    supabase.from('mous').select('*', { count: 'exact', head: true }).eq('status', 'expiring'),
    supabase.from('revenue_share').select('*', { count: 'exact', head: true }).eq('payout_status', 'pending'),
  ])

  const students = totalStudents || 0
  const placementRate = students ? Math.round(((placedStudents || 0) / students) * 100) : 0
  const scores = (colleges || []).map((c: any) => c.health_score || 0)
  const avgHealth = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
  const belowSixty = scores.filter((h: number) => h > 0 && h < 60).length
  const risk = highRisk || 0
  const expiring = expiringMous || 0
  const payouts = pendingPayouts || 0

  const recs: string[] = []
  if (expiring > 0) recs.push(`Initiate renewal outreach for ${expiring} expiring MOU${expiring > 1 ? 's' : ''} — protect recurring revenue`)
  if (risk > 0) recs.push(`Run CRT + mock-interview drives for ${risk} high-risk students before placement season`)
  if (belowSixty > 0) recs.push(`Targeted intervention for ${belowSixty} college${belowSixty > 1 ? 's' : ''} below 60 health`)
  if (payouts > 0) recs.push(`Approve ${payouts} pending revenue payout${payouts > 1 ? 's' : ''}`)
  if (recs.length === 0) recs.push('Portfolio is healthy — focus on upselling AI Interview programs to top partners')

  const metrics = [
    { label: 'Placement Rate', value: `${placementRate}%`, c: placementRate >= 60 ? 'text-green-600' : 'text-yellow-600' },
    { label: 'Avg Health', value: `${avgHealth}/100`, c: avgHealth >= 70 ? 'text-green-600' : avgHealth >= 50 ? 'text-yellow-600' : 'text-red-600' },
    { label: 'High-Risk Students', value: risk, c: 'text-red-600' },
    { label: 'MOUs Expiring', value: expiring, c: expiring > 0 ? 'text-yellow-600' : 'text-green-600' },
  ]

  const narration =
    `Executive summary. Across ${totalColleges || 0} partner colleges and ${students.toLocaleString()} students, ` +
    `placement readiness is at ${placementRate} percent, with an average partner health of ${avgHealth} out of 100. ` +
    (risk > 0 ? `${risk} students are flagged high risk. ` : '') +
    (expiring > 0 ? `${expiring} ${expiring > 1 ? 'partnerships are' : 'partnership is'} expiring soon. ` : '') +
    (belowSixty > 0 ? `${belowSixty} ${belowSixty > 1 ? 'colleges need' : 'college needs'} attention. ` : '') +
    `Recommended actions: ${recs.slice(0, 3).join('. ')}.`

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.05] to-purple-500/[0.04] p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">AI Executive Summary</h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">live · computed from data</span>
        </div>
        <VoiceSummary text={narration} label="Narrate" />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Across <strong className="text-foreground">{totalColleges || 0}</strong> partner colleges and{' '}
        <strong className="text-foreground">{students.toLocaleString()}</strong> students, placement readiness sits at{' '}
        <strong className="text-foreground">{placementRate}%</strong> with an average partner health of{' '}
        <strong className="text-foreground">{avgHealth}/100</strong>.{' '}
        {risk > 0 && <><strong className="text-red-600">{risk}</strong> students are flagged high-risk. </>}
        {expiring > 0 && <><strong className="text-yellow-600">{expiring}</strong> MOU{expiring > 1 ? 's are' : ' is'} expiring soon. </>}
        {belowSixty > 0 && <><strong className="text-yellow-600">{belowSixty}</strong> college{belowSixty > 1 ? 's' : ''} need attention.</>}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {metrics.map(m => (
          <div key={m.label} className="rounded-lg bg-card border p-3">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className={`text-xl font-bold ${m.c}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-primary/20 bg-card p-3">
        <p className="text-xs font-semibold text-primary mb-1.5">🎯 Recommended Actions</p>
        <ul className="space-y-1">
          {recs.slice(0, 3).map((r, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <ArrowUpRight className="h-3 w-3 mt-0.5 text-primary shrink-0" /> {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
