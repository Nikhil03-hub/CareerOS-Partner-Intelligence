import { createServiceClient } from '@/lib/supabase/server'
import { FixRealismButton } from './FixRealismButton'
import { RecomputeHealthButton } from './RecomputeHealthButton'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  void user

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform configuration and integrations</p>
      </div>

      <div className="space-y-4">
        {/* Notification integrations */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4">Notification Integrations</h3>
          <div className="space-y-3">
            {[
              { name: 'Telegram Bot', desc: 'Sends alerts to a Telegram channel' },
              { name: 'Email (Resend)', desc: 'Sends email notifications via Resend' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <span className="text-xs font-medium badge badge-green">Configured</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="rounded-xl border bg-card p-5 space-y-5">
          <div>
            <h3 className="text-base font-semibold mb-1">Data Management</h3>
            <p className="text-xs text-muted-foreground">
              Administrative tools for data initialization and AI health computation.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 pb-4 border-b">
            <div>
              <p className="text-sm font-semibold">1. Fix Student Realism</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Spreads readiness scores (35–98%) and risk levels (High 15% · Med 30% · Low 55%). Run once after seeding.
              </p>
            </div>
            <FixRealismButton />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">2. Recompute All Health Scores</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Batch-computes AI College Health Score for all colleges from live DB and writes to leaderboard. Run after Fix Student Realism.
              </p>
            </div>
            <RecomputeHealthButton />
          </div>
        </div>

        {/* Scheduled Jobs */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4">Scheduled Jobs</h3>
          <div className="space-y-3">
            {[
              { name: 'MOU Renewal Cron', schedule: 'Daily at 9am IST', desc: 'Scans for MOUs expiring within 30 days and sends alerts' },
              { name: 'Health Score Compute', schedule: 'Weekly Sunday midnight', desc: 'Recomputes college health scores and stores history' },
              { name: 'Student Risk Refresh', schedule: 'Weekly Sunday midnight', desc: 'Re-evaluates student placement risk levels' },
            ].map(j => (
              <div key={j.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{j.name}</p>
                  <p className="text-xs text-muted-foreground">{j.desc}</p>
                  <p className="text-xs text-primary mt-0.5">⏰ {j.schedule}</p>
                </div>
                <span className="text-xs font-medium badge badge-green">Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Info */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4">Platform</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Stack', value: 'Next.js 14 + Supabase' },
              { label: 'Database', value: 'PostgreSQL (Supabase)' },
              { label: 'Auth', value: 'Supabase Auth' },
              { label: 'Storage', value: 'Supabase Storage' },
              { label: 'AI Engine', value: 'Placement Predictor v2' },
              { label: 'Plan', value: 'Enterprise' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-muted-foreground text-xs">{s.label}</p>
                <p className="font-medium">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
